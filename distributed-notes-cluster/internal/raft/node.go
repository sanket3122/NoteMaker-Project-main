package raft

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"math/rand"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"distributed-notes-cluster/internal/model"
	"distributed-notes-cluster/internal/wal"
)

type Role string

const (
	RoleFollower  Role = "follower"
	RoleCandidate Role = "candidate"
	RoleLeader    Role = "leader"
)

type StateMachine interface {
	Apply(entry model.LogEntry) interface{}
	CheckDedupe(clientID string, seq uint64) (reply interface{}, ok bool)
	PutDedupe(clientID string, seq uint64, reply interface{})
}

type Config struct {
	NodeID   string
	HTTPAddr string
	Peers    []Peer

	WAL          *wal.WAL
	StateMachine StateMachine

	HeartbeatEvery time.Duration
	ElectionMin    time.Duration
	ElectionMax    time.Duration
}

type nodeMetrics struct {
	role        atomic.Int64
	term        atomic.Uint64
	logLen      atomic.Int64
	commitIndex atomic.Int64
	lastApplied atomic.Int64
	rpcErrors   atomic.Uint64
}

type MetricsSnapshot struct {
	Role        int64  `json:"role"`
	Term        uint64 `json:"term"`
	LogLen      int64  `json:"log_len"`
	CommitIndex int64  `json:"commit_index"`
	LastApplied int64  `json:"last_applied"`
	RpcErrors   uint64 `json:"rpc_errors"`
}

type Node struct {
	mu sync.Mutex

	cfg Config

	role Role

	currentTerm uint64
	votedFor    string

	log []model.LogEntry

	commitIndex int
	lastApplied int

	leaderID  string
	leaderURL string

	// leader only
	nextIndex  map[string]int
	matchIndex map[string]int

	// timing
	electionDeadline time.Time
	lastHeartbeat    time.Time
	rng              *rand.Rand

	httpc *http.Client

	metrics nodeMetrics
}

func NewNode(cfg Config) *Node {
	n := &Node{
		cfg:         cfg,
		role:        RoleFollower,
		commitIndex: -1,
		lastApplied: -1,
		nextIndex:   make(map[string]int),
		matchIndex:  make(map[string]int),
		rng:         rand.New(rand.NewSource(time.Now().UnixNano())),
		httpc:       &http.Client{Timeout: 900 * time.Millisecond},
	}

	// Load persisted meta + log
	if cfg.WAL != nil {
		if term, votedFor, ok, err := cfg.WAL.LoadMeta(); err == nil && ok {
			n.currentTerm = term
			n.votedFor = votedFor
		}
		if entries, err := cfg.WAL.LoadLog(); err == nil {
			n.log = entries
		}
		// Demo-friendly restart: treat loaded entries as committed & applied.
		if len(n.log) > 0 {
			n.commitIndex = len(n.log) - 1
		}
		n.applyLocked()
	}

	n.resetElectionDeadlineLocked()
	n.updateMetricsLocked()
	return n
}

func (n *Node) MetricsSnapshot() MetricsSnapshot {
	return MetricsSnapshot{
		Role:        n.metrics.role.Load(),
		Term:        n.metrics.term.Load(),
		LogLen:      n.metrics.logLen.Load(),
		CommitIndex: n.metrics.commitIndex.Load(),
		LastApplied: n.metrics.lastApplied.Load(),
		RpcErrors:   n.metrics.rpcErrors.Load(),
	}
}

func (n *Node) Tick() {
	n.mu.Lock()
	defer n.mu.Unlock()

	now := time.Now()

	switch n.role {
	case RoleLeader:
		if now.Sub(n.lastHeartbeat) >= n.cfg.HeartbeatEvery {
			n.lastHeartbeat = now
			go n.broadcastAppendEntries()
		}
	default:
		if now.After(n.electionDeadline) {
			go n.startElection()
		}
	}

	n.updateMetricsLocked()
}

func (n *Node) updateMetricsLocked() {
	var roleVal int64
	switch n.role {
	case RoleFollower:
		roleVal = 0
	case RoleCandidate:
		roleVal = 1
	case RoleLeader:
		roleVal = 2
	}
	n.metrics.role.Store(roleVal)
	n.metrics.term.Store(n.currentTerm)
	n.metrics.logLen.Store(int64(len(n.log)))
	n.metrics.commitIndex.Store(int64(n.commitIndex))
	n.metrics.lastApplied.Store(int64(n.lastApplied))
}

func (n *Node) resetElectionDeadlineLocked() {
	d := n.cfg.ElectionMin + time.Duration(n.rng.Int63n(int64(n.cfg.ElectionMax-n.cfg.ElectionMin)))
	n.electionDeadline = time.Now().Add(d)
}

// ---------------- Client API ----------------

type ClientCommandRequest struct {
	ClientID string        `json:"client_id"`
	Seq      uint64        `json:"seq"`
	Command  model.Command `json:"command"`
}

type ClientCommandResponse struct {
	Ok        bool        `json:"ok"`
	Redirect  bool        `json:"redirect,omitempty"`
	LeaderID  string      `json:"leader_id,omitempty"`
	LeaderURL string      `json:"leader_url,omitempty"`
	Term      uint64      `json:"term,omitempty"`
	Result    interface{} `json:"result,omitempty"`
	Error     string      `json:"error,omitempty"`
}

func (n *Node) SubmitClientCommand(req ClientCommandRequest) ClientCommandResponse {
	// Dedupe at the state machine layer
	if rep, ok := n.cfg.StateMachine.CheckDedupe(req.ClientID, req.Seq); ok {
		return ClientCommandResponse{Ok: true, Result: rep, Term: n.CurrentTerm()}
	}

	n.mu.Lock()
	if n.role != RoleLeader {
		leaderURL := n.leaderURL
		leaderID := n.leaderID
		term := n.currentTerm
		n.mu.Unlock()
		return ClientCommandResponse{Ok: false, Redirect: true, LeaderID: leaderID, LeaderURL: leaderURL, Term: term}
	}

	// append entry
	entry := model.LogEntry{
		Index:   len(n.log),
		Term:    n.currentTerm,
		Command: req.Command,
		TimeUTC: time.Now().UTC(),
	}
	n.log = append(n.log, entry)
	if n.cfg.WAL != nil {
		_ = n.cfg.WAL.Append(entry)
	}

	// leader bookkeeping
	for _, p := range n.cfg.Peers {
		if _, ok := n.nextIndex[p.ID]; !ok {
			n.nextIndex[p.ID] = len(n.log)
			n.matchIndex[p.ID] = -1
		}
	}
	n.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
	defer cancel()

	if err := n.replicateAndCommit(ctx); err != nil {
		return ClientCommandResponse{Ok: false, Error: err.Error(), Term: n.CurrentTerm()}
	}

	reply := map[string]any{"ok": true, "index": entry.Index, "term": entry.Term}
	n.cfg.StateMachine.PutDedupe(req.ClientID, req.Seq, reply)

	return ClientCommandResponse{Ok: true, Result: reply, Term: n.CurrentTerm()}
}

func (n *Node) CurrentTerm() uint64 {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.currentTerm
}

// ---------------- RPC handlers ----------------

func (n *Node) OnRequestVote(req RequestVoteRequest) RequestVoteResponse {
	n.mu.Lock()
	defer n.mu.Unlock()

	if req.Term < n.currentTerm {
		return RequestVoteResponse{Term: n.currentTerm, VoteGranted: false}
	}
	if req.Term > n.currentTerm {
		n.becomeFollowerLocked(req.Term, "")
	}

	lastIdx, lastTerm := n.lastLogInfoLocked()
	upToDate := (req.LastLogTerm > lastTerm) || (req.LastLogTerm == lastTerm && req.LastLogIndex >= lastIdx)

	if (n.votedFor == "" || n.votedFor == req.CandidateID) && upToDate {
		n.votedFor = req.CandidateID
		if n.cfg.WAL != nil {
			_ = n.cfg.WAL.SaveMeta(n.currentTerm, n.votedFor)
		}
		n.resetElectionDeadlineLocked()
		return RequestVoteResponse{Term: n.currentTerm, VoteGranted: true}
	}
	return RequestVoteResponse{Term: n.currentTerm, VoteGranted: false}
}

func (n *Node) OnAppendEntries(req AppendEntriesRequest) AppendEntriesResponse {
	n.mu.Lock()
	defer n.mu.Unlock()

	if req.Term < n.currentTerm {
		return AppendEntriesResponse{Term: n.currentTerm, Success: false}
	}
	if req.Term > n.currentTerm || n.role != RoleFollower {
		n.becomeFollowerLocked(req.Term, req.LeaderID)
	}
	n.leaderID = req.LeaderID
	n.leaderURL = n.findPeerURLLocked(req.LeaderID)
	n.resetElectionDeadlineLocked()

	if req.PrevLogIndex >= 0 {
		if req.PrevLogIndex >= len(n.log) {
			return AppendEntriesResponse{Term: n.currentTerm, Success: false, ConflictIndex: len(n.log)}
		}
		if n.log[req.PrevLogIndex].Term != req.PrevLogTerm {
			conflictTerm := n.log[req.PrevLogIndex].Term
			i := req.PrevLogIndex
			for i >= 0 && n.log[i].Term == conflictTerm {
				i--
			}
			return AppendEntriesResponse{Term: n.currentTerm, Success: false, ConflictIndex: i + 1}
		}
	}

	insertAt := req.PrevLogIndex + 1
	for i, e := range req.Entries {
		pos := insertAt + i
		if pos < len(n.log) {
			if n.log[pos].Term != e.Term {
				n.log = n.log[:pos]
				n.appendEntryLocked(e)
				for j := i + 1; j < len(req.Entries); j++ {
					n.appendEntryLocked(req.Entries[j])
				}
				break
			}
		} else {
			n.appendEntryLocked(e)
		}
	}

	if req.LeaderCommit > n.commitIndex {
		last := len(n.log) - 1
		if req.LeaderCommit < last {
			n.commitIndex = req.LeaderCommit
		} else {
			n.commitIndex = last
		}
		n.applyLocked()
	}

	return AppendEntriesResponse{Term: n.currentTerm, Success: true}
}

func (n *Node) appendEntryLocked(e model.LogEntry) {
	e.Index = len(n.log)
	n.log = append(n.log, e)
	if n.cfg.WAL != nil {
		_ = n.cfg.WAL.Append(e)
	}
}

func (n *Node) applyLocked() {
	for n.lastApplied < n.commitIndex {
		n.lastApplied++
		entry := n.log[n.lastApplied]
		_ = n.cfg.StateMachine.Apply(entry)
	}
}

// ---------------- Leader replication ----------------

func (n *Node) replicateAndCommit(ctx context.Context) error {
	ticker := time.NewTicker(60 * time.Millisecond)
	defer ticker.Stop()

	for {
		n.mu.Lock()
		if n.role != RoleLeader {
			n.mu.Unlock()
			return errors.New("not leader")
		}
		lastIndex := len(n.log) - 1
		n.mu.Unlock()

		n.broadcastAppendEntries()

		select {
		case <-ctx.Done():
			return errors.New("commit timeout")
		case <-ticker.C:
			if n.tryAdvanceCommit() >= lastIndex {
				return nil
			}
		}
	}
}

func (n *Node) tryAdvanceCommit() int {
	n.mu.Lock()
	defer n.mu.Unlock()

	if n.role != RoleLeader {
		return n.commitIndex
	}

	for idx := len(n.log) - 1; idx > n.commitIndex; idx-- {
		if n.log[idx].Term != n.currentTerm {
			continue
		}
		count := 1
		for _, p := range n.cfg.Peers {
			if n.matchIndex[p.ID] >= idx {
				count++
			}
		}
		if count >= n.majorityLocked() {
			n.commitIndex = idx
			n.applyLocked()
			return n.commitIndex
		}
	}
	return n.commitIndex
}

func (n *Node) broadcastAppendEntries() {
	n.mu.Lock()
	if n.role != RoleLeader {
		n.mu.Unlock()
		return
	}
	peers := append([]Peer(nil), n.cfg.Peers...)
	n.mu.Unlock()

	for _, p := range peers {
		go n.sendAppendEntries(p)
	}
}

func (n *Node) sendAppendEntries(p Peer) {
	n.mu.Lock()
	if n.role != RoleLeader {
		n.mu.Unlock()
		return
	}
	next := n.nextIndex[p.ID]
	prevIdx := next - 1
	var prevTerm uint64
	if prevIdx >= 0 && prevIdx < len(n.log) {
		prevTerm = n.log[prevIdx].Term
	}
	// entries := []model.model.LogEntry{}
	entries := []model.LogEntry{}

	if next >= 0 && next < len(n.log) {
		entries = append(entries, n.log[next:]...)
	}
	req := AppendEntriesRequest{
		Term:         n.currentTerm,
		LeaderID:     n.cfg.NodeID,
		PrevLogIndex: prevIdx,
		PrevLogTerm:  prevTerm,
		Entries:      entries,
		LeaderCommit: n.commitIndex,
	}
	url := p.URL + "/rpc/append_entries"
	n.mu.Unlock()

	resp, err := postJSON[AppendEntriesRequest, AppendEntriesResponse](n.httpc, url, req)
	if err != nil {
		n.metrics.rpcErrors.Add(1)
		return
	}

	n.mu.Lock()
	defer n.mu.Unlock()

	if resp.Term > n.currentTerm {
		n.becomeFollowerLocked(resp.Term, "")
		return
	}
	if n.role != RoleLeader || req.Term != n.currentTerm {
		return
	}

	if resp.Success {
		match := req.PrevLogIndex + len(req.Entries)
		n.matchIndex[p.ID] = match
		n.nextIndex[p.ID] = match + 1
	} else {
		if resp.ConflictIndex > 0 {
			n.nextIndex[p.ID] = resp.ConflictIndex
		} else {
			if n.nextIndex[p.ID] > 0 {
				n.nextIndex[p.ID]--
			}
		}
	}
}

// ---------------- Election ----------------

func (n *Node) startElection() {
	n.mu.Lock()
	n.role = RoleCandidate
	n.currentTerm++
	term := n.currentTerm
	n.votedFor = n.cfg.NodeID
	if n.cfg.WAL != nil {
		_ = n.cfg.WAL.SaveMeta(n.currentTerm, n.votedFor)
	}
	n.resetElectionDeadlineLocked()
	lastIdx, lastTerm := n.lastLogInfoLocked()
	peers := append([]Peer(nil), n.cfg.Peers...)
	n.mu.Unlock()

	votes := 1
	var mu sync.Mutex
	done := make(chan struct{}, 1)
	ctx, cancel := context.WithTimeout(context.Background(), 900*time.Millisecond)
	defer cancel()

	for _, p := range peers {
		go func(peer Peer) {
			req := RequestVoteRequest{
				Term:         term,
				CandidateID:  n.cfg.NodeID,
				LastLogIndex: lastIdx,
				LastLogTerm:  lastTerm,
			}
			resp, err := postJSON[RequestVoteRequest, RequestVoteResponse](n.httpc, peer.URL+"/rpc/request_vote", req)
			if err != nil {
				n.metrics.rpcErrors.Add(1)
				return
			}

			n.mu.Lock()
			if resp.Term > n.currentTerm {
				n.becomeFollowerLocked(resp.Term, "")
				n.mu.Unlock()
				return
			}
			if n.role != RoleCandidate || n.currentTerm != term {
				n.mu.Unlock()
				return
			}
			n.mu.Unlock()

			if resp.VoteGranted {
				mu.Lock()
				votes++
				if votes >= n.majorityLocked() {
					select {
					case done <- struct{}{}:
					default:
					}
				}
				mu.Unlock()
			}
		}(p)
	}

	select {
	case <-ctx.Done():
		return
	case <-done:
		n.mu.Lock()
		if n.role == RoleCandidate && n.currentTerm == term {
			n.becomeLeaderLocked()
		}
		n.mu.Unlock()
	}
}

func (n *Node) becomeLeaderLocked() {
	n.role = RoleLeader
	n.leaderID = n.cfg.NodeID
	n.leaderURL = "http://" + n.cfg.HTTPAddr
	for _, p := range n.cfg.Peers {
		n.nextIndex[p.ID] = len(n.log)
		n.matchIndex[p.ID] = -1
	}
	n.lastHeartbeat = time.Now()
}

func (n *Node) becomeFollowerLocked(term uint64, leaderID string) {
	n.role = RoleFollower
	n.currentTerm = term
	n.votedFor = ""
	n.leaderID = leaderID
	n.leaderURL = n.findPeerURLLocked(leaderID)
	if n.cfg.WAL != nil {
		_ = n.cfg.WAL.SaveMeta(n.currentTerm, n.votedFor)
	}
	n.resetElectionDeadlineLocked()
}

func (n *Node) lastLogInfoLocked() (idx int, term uint64) {
	if len(n.log) == 0 {
		return -1, 0
	}
	last := n.log[len(n.log)-1]
	return last.Index, last.Term
}

func (n *Node) majorityLocked() int {
	total := 1 + len(n.cfg.Peers)
	return total/2 + 1
}

func (n *Node) findPeerURLLocked(id string) string {
	if id == "" {
		return ""
	}
	for _, p := range n.cfg.Peers {
		if p.ID == id {
			return p.URL
		}
	}
	return ""
}

// ---------------- Helpers ----------------

func postJSON[Req any, Resp any](c *http.Client, url string, req Req) (Resp, error) {
	var zero Resp

	b, err := json.Marshal(req)
	if err != nil {
		return zero, err
	}
	httpReq, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewReader(b))
	if err != nil {
		return zero, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	r, err := c.Do(httpReq)
	if err != nil {
		return zero, err
	}
	defer r.Body.Close()

	if r.StatusCode < 200 || r.StatusCode >= 300 {
		return zero, errors.New("http status " + r.Status)
	}

	var resp Resp
	if err := json.NewDecoder(r.Body).Decode(&resp); err != nil {
		return zero, err
	}
	return resp, nil
}

// func (n *Node) MetricsSnapshot() Metrics {
// 	n.mu.Lock()
// 	defer n.mu.Unlock()

// 	return Metrics{
// 		Role:        int(n.role),
// 		Term:        n.currentTerm,
// 		LogLen:      len(n.log),
// 		CommitIndex: n.commitIndex,
// 		LastApplied: n.lastApplied,
// 		RpcErrors:   n.rpcErrors,
// 	}
// }
