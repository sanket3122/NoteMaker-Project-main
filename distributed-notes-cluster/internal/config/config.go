package config

import (
	"errors"
	"strings"

	"distributed-notes-cluster/internal/raft"
)

// PEERS format:
// node1=http://localhost:7101,node2=http://localhost:7102,...
func ParsePeers(raw string, selfID string) ([]raft.Peer, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, errors.New("PEERS is empty")
	}

	parts := strings.Split(raw, ",")
	out := make([]raft.Peer, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		kv := strings.SplitN(p, "=", 2)
		if len(kv) != 2 {
			return nil, errors.New("invalid peer: " + p)
		}
		id := strings.TrimSpace(kv[0])
		url := strings.TrimSpace(kv[1])
		if id == "" || url == "" {
			return nil, errors.New("invalid peer: " + p)
		}
		if id == selfID {
			continue
		}
		out = append(out, raft.Peer{ID: id, URL: url})
	}
	return out, nil
}
