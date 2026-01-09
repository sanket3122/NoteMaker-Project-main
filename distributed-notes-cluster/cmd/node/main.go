package main

import (
	"log"
	"os"
	"strings"
	"time"

	"distributed-notes-cluster/internal/config"
	"distributed-notes-cluster/internal/httpapi"
	"distributed-notes-cluster/internal/raft"
	"distributed-notes-cluster/internal/store"
	"distributed-notes-cluster/internal/wal"
)

func mustEnv(key, def string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	return v
}

func main() {
	nodeID := mustEnv("NODE_ID", "node1")
	httpAddr := mustEnv("HTTP_ADDR", "localhost:7101")
	dataDir := mustEnv("DATA_DIR", "./.data/"+nodeID)
	peersRaw := mustEnv("PEERS", "")

	peers, err := config.ParsePeers(peersRaw, nodeID)
	if err != nil {
		log.Fatalf("parse peers: %v", err)
	}

	w, err := wal.New(dataDir)
	if err != nil {
		log.Fatalf("wal init: %v", err)
	}

	st := store.New()

	rn := raft.NewNode(raft.Config{
		NodeID:         nodeID,
		HTTPAddr:       httpAddr,
		Peers:          peers,
		WAL:            w,
		StateMachine:   st,
		HeartbeatEvery: 120 * time.Millisecond,
		ElectionMin:    450 * time.Millisecond,
		ElectionMax:    850 * time.Millisecond,
	})

	s := httpapi.NewServer(httpapi.ServerConfig{
		Node:  rn,
		Store: st,
	})

	log.Printf("[%s] starting on %s", nodeID, httpAddr)
	if err := s.ListenAndServe(httpAddr); err != nil {
		log.Fatal(err)
	}
}
