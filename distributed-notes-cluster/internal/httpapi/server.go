package httpapi

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"distributed-notes-cluster/internal/raft"
	"distributed-notes-cluster/internal/store"
)

type ServerConfig struct {
	Node  *raft.Node
	Store *store.Store
}

type Server struct {
	cfg ServerConfig
	mux *http.ServeMux
}

func NewServer(cfg ServerConfig) *Server {
	s := &Server{
		cfg: cfg,
		mux: http.NewServeMux(),
	}

	// raft tick
	go func() {
		t := time.NewTicker(50 * time.Millisecond)
		defer t.Stop()
		for range t.C {
			cfg.Node.Tick()
		}
	}()

	s.mux.HandleFunc("/metrics", s.handleMetrics)
	s.mux.HandleFunc("/admin/status", s.handleStatus)

	s.mux.HandleFunc("/rpc/request_vote", s.handleRequestVote)
	s.mux.HandleFunc("/rpc/append_entries", s.handleAppendEntries)

	s.mux.HandleFunc("/client/command", s.handleClientCommand)
	s.mux.HandleFunc("/client/notes", s.handleClientNotes)

	s.mux.HandleFunc("/metrics", s.handleMetrics)

	return s
}

func (s *Server) ListenAndServe(addr string) error {
	return http.ListenAndServe(addr, s.mux)
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	m := s.cfg.Node.MetricsSnapshot()

	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	fmt.Fprintf(w, "# TYPE raft_role gauge\nraft_role %d\n", m.Role)
	fmt.Fprintf(w, "# TYPE raft_current_term gauge\nraft_current_term %d\n", m.Term)
	fmt.Fprintf(w, "# TYPE raft_log_length gauge\nraft_log_length %d\n", m.LogLen)
	fmt.Fprintf(w, "# TYPE raft_commit_index gauge\nraft_commit_index %d\n", m.CommitIndex)
	fmt.Fprintf(w, "# TYPE raft_last_applied gauge\nraft_last_applied %d\n", m.LastApplied)
	fmt.Fprintf(w, "# TYPE raft_rpc_errors_total counter\nraft_rpc_errors_total %d\n", m.RpcErrors)
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	m := s.cfg.Node.MetricsSnapshot()
	resp := map[string]any{
		"term":         m.Term,
		"role":         m.Role,
		"log_len":      m.LogLen,
		"commit_index": m.CommitIndex,
		"last_applied": m.LastApplied,
		"rpc_errors":   m.RpcErrors,
		"tip":          "followers return redirect fields from POST /client/command",
	}
	writeJSON(w, resp, 200)
}

func (s *Server) handleRequestVote(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req raft.RequestVoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()}, 400)
		return
	}
	resp := s.cfg.Node.OnRequestVote(req)
	writeJSON(w, resp, 200)
}

func (s *Server) handleAppendEntries(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req raft.AppendEntriesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()}, 400)
		return
	}
	resp := s.cfg.Node.OnAppendEntries(req)
	writeJSON(w, resp, 200)
}

func (s *Server) handleClientCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req raft.ClientCommandRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"ok": false, "error": err.Error()}, 400)
		return
	}
	resp := s.cfg.Node.SubmitClientCommand(req)
	writeJSON(w, resp, 200)
}

func (s *Server) handleClientNotes(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		writeJSON(w, map[string]any{"error": "missing user_id"}, 400)
		return
	}
	notes := s.cfg.Store.ListNotes(userID)
	writeJSON(w, map[string]any{"ok": true, "notes": notes}, 200)
}

func writeJSON(w http.ResponseWriter, v any, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write json: %v", err)
	}
}

// func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != "GET" {
// 		w.WriteHeader(http.StatusMethodNotAllowed)
// 		return
// 	}

// 	m := s.cfg.Node.MetricsSnapshot()

// 	w.Header().Set("Content-Type", "text/plain; version=0.0.4")

// 	fmt.Fprintf(w, "raft_role %d\n", m.Role)
// 	fmt.Fprintf(w, "raft_current_term %d\n", m.Term)
// 	fmt.Fprintf(w, "raft_log_length %d\n", m.LogLen)
// 	fmt.Fprintf(w, "raft_commit_index %d\n", m.CommitIndex)
// 	fmt.Fprintf(w, "raft_last_applied %d\n", m.LastApplied)
// 	fmt.Fprintf(w, "raft_rpc_errors_total %d\n", m.RpcErrors)
// }
