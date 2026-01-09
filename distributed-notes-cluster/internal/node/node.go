package node

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"

	"distributed-notes-cluster/internal/state"
)

type Node struct {
	// existing fields you already have in this struct can remain
	// keep them above/below; these are the new ones:
	state        *state.State
	statePath    string
	appMu        sync.RWMutex
	appState     *state.AppState
	appStatePath string
}

// Call this once during node startup, after you know dataDir
func (n *Node) InitAppState(dataDir string) error {
	// IMPORTANT: do NOT use "state.json" (RAFT already uses it)
	n.appStatePath = filepath.Join(dataDir, "app_state.json")
	return n.loadAppState()
}

func (n *Node) loadAppState() error {
	n.appMu.Lock()
	defer n.appMu.Unlock()

	data, err := os.ReadFile(n.appStatePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			n.appState = state.NewAppState()
			return nil
		}
		return err
	}

	var st state.AppState
	if err := json.Unmarshal(data, &st); err != nil {
		// if file corrupted, still boot with empty state (don’t crash cluster)
		n.appState = state.NewAppState()
		return nil
	}
	if st.Users == nil {
		st.Users = make(map[string]*state.UserState)
	}
	n.appState = &st
	return nil
}

func (n *Node) persistAppState() error {
	n.appMu.RLock()
	defer n.appMu.RUnlock()

	data, _ := json.MarshalIndent(n.appState, "", "  ")
	return os.WriteFile(n.appStatePath, data, 0644)
}

// Helpers used by HTTP handlers + apply loop
func (n *Node) GetNotes(userID string) []*state.Note {
	n.appMu.RLock()
	defer n.appMu.RUnlock()

	out := []*state.Note{}
	u, ok := n.appState.Users[userID]
	if !ok || u == nil || u.Notes == nil {
		return out
	}
	for _, note := range u.Notes {
		out = append(out, note)
	}
	return out
}

func (n *Node) ApplyNoteCreate(userID, noteID, title, description, tag string) error {
	n.appMu.Lock()
	defer n.appMu.Unlock()

	u := n.appState.EnsureUser(userID)
	u.Notes[noteID] = &state.Note{
		NoteID:      noteID,
		Title:       title,
		Description: description,
		Tag:         tag,
		UpdatedAt:   state.NowUTC(),
	}
	return n.persistAppState()
}

func (n *Node) ApplyNoteUpdate(userID, noteID, title, description, tag string) error {
	n.appMu.Lock()
	defer n.appMu.Unlock()

	u := n.appState.EnsureUser(userID)
	existing, ok := u.Notes[noteID]
	if !ok {
		// if note doesn't exist, create it (keeps system simple)
		existing = &state.Note{NoteID: noteID}
		u.Notes[noteID] = existing
	}
	if title != "" {
		existing.Title = title
	}
	if description != "" {
		existing.Description = description
	}
	if tag != "" {
		existing.Tag = tag
	}
	existing.UpdatedAt = state.NowUTC()

	return n.persistAppState()
}

func (n *Node) ApplyNoteDelete(userID, noteID string) error {
	n.appMu.Lock()
	defer n.appMu.Unlock()

	u, ok := n.appState.Users[userID]
	if ok && u != nil && u.Notes != nil {
		delete(u.Notes, noteID)
	}
	return n.persistAppState()
}
