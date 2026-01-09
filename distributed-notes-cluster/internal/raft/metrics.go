package raft

// package raft

type Metrics struct {
	Role        int
	Term        int
	LogLen      int
	CommitIndex int
	LastApplied int
	RpcErrors   int
}
