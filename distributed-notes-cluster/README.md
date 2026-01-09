## Overview
A Raft-based distributed notes system implemented in Go, with leader election,
log replication, and real-time observability using Prometheus and Grafana.

## Architecture
- 5-node Raft cluster
- Single leader, multiple followers
- WAL-backed log replication
- HTTP client gateway
- Prometheus metrics exposed per node
- Grafana dashboard for live leader election

## Observability
Each node exposes `/metrics` with:
- raft_role (Follower / Candidate / Leader)
- raft_current_term
- raft_commit_index
- raft_last_applied
- raft_rpc_errors_total

Prometheus scrapes all nodes and Grafana visualizes cluster state in real time.

## Demo
1. Start the cluster
2. Observe leader in Grafana
3. Kill the leader process
4. Watch automatic re-election

## Tech Stack
Go, Raft, Prometheus, Grafana, HTTP APIs
