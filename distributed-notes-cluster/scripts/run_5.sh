#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export PEERS="node1=http://localhost:7101,node2=http://localhost:7102,node3=http://localhost:7103,node4=http://localhost:7104,node5=http://localhost:7105"

run_node () {
  local id="$1"
  local addr="$2"
  local dir="$ROOT/.data/$id"
  mkdir -p "$dir"
  echo "Starting $id on $addr (data: $dir)"
  NODE_ID="$id" HTTP_ADDR="$addr" DATA_DIR="$dir" PEERS="$PEERS"     go run "$ROOT/cmd/node/main.go" &
}

pkill -f "cmd/node/main.go" >/dev/null 2>&1 || true

run_node "node1" "localhost:7101"
run_node "node2" "localhost:7102"
run_node "node3" "localhost:7103"
run_node "node4" "localhost:7104"
run_node "node5" "localhost:7105"

echo ""
echo "Cluster is starting. Try:"
echo "  curl -s http://localhost:7101/admin/status | jq"
echo ""
wait
