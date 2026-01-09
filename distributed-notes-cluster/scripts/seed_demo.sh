#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-http://localhost:7101}"

curl -s "$HOST/client/command"   -H "Content-Type: application/json"   -d '{
    "client_id":"user_123",
    "seq": 1,
    "command": {
      "type":"NOTE_CREATE",
      "user_id":"user_123",
      "note_id":"note_a1",
      "title":"Hi There",
      "description":"Good Morning",
      "tag":"default"
    }
  }' | jq

curl -s "$HOST/client/command"   -H "Content-Type: application/json"   -d '{
    "client_id":"user_123",
    "seq": 2,
    "command": {
      "type":"NOTE_UPDATE",
      "user_id":"user_123",
      "note_id":"note_a1",
      "title":"Hi There2",
      "description":"Good Morning2",
      "tag":"default"
    }
  }' | jq

curl -s "http://localhost:7103/client/notes?user_id=user_123" | jq
