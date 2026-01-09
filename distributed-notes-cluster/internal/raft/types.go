package raft

import "distributed-notes-cluster/internal/model"

type Peer struct {
	ID  string
	URL string // e.g. http://localhost:7102
}

type RequestVoteRequest struct {
	Term         uint64 `json:"term"`
	CandidateID  string `json:"candidate_id"`
	LastLogIndex int    `json:"last_log_index"`
	LastLogTerm  uint64 `json:"last_log_term"`
}

type RequestVoteResponse struct {
	Term        uint64 `json:"term"`
	VoteGranted bool   `json:"vote_granted"`
}

type AppendEntriesRequest struct {
	Term         uint64          `json:"term"`
	LeaderID     string          `json:"leader_id"`
	PrevLogIndex int             `json:"prev_log_index"`
	PrevLogTerm  uint64          `json:"prev_log_term"`
	Entries      []model.LogEntry `json:"entries"`
	LeaderCommit int             `json:"leader_commit"`
}

type AppendEntriesResponse struct {
	Term          uint64 `json:"term"`
	Success       bool   `json:"success"`
	ConflictIndex int    `json:"conflict_index,omitempty"`
}
