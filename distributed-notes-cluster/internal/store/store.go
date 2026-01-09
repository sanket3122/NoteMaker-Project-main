package store

import (
	"errors"
	"sort"
	"sync"
	"time"
)

type Note struct {
	NoteID      string `json:"note_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Tag         string `json:"tag"`
	UpdatedAt   string `json:"updated_at"`
}

type Store struct {
	mu    sync.RWMutex
	users map[string]map[string]*Note // user_id -> note_id -> note
}

func New() *Store {
	return &Store{
		users: make(map[string]map[string]*Note),
	}
}

func nowUTC() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

// ---- READ API ----

func (s *Store) ListNotes(userID string) []*Note {
	s.mu.RLock()
	defer s.mu.RUnlock()

	m := s.users[userID]
	if m == nil {
		return []*Note{}
	}

	out := make([]*Note, 0, len(m))
	for _, n := range m {
		out = append(out, n)
	}

	// stable order (helps UI not shuffle)
	sort.Slice(out, func(i, j int) bool {
		return out[i].UpdatedAt > out[j].UpdatedAt
	})

	return out
}

// ---- APPLY API (called by raft commit apply) ----

type Command struct {
	Type        string `json:"type"`
	UserID      string `json:"user_id"`
	NoteID      string `json:"note_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Tag         string `json:"tag"`
}

func (s *Store) Apply(cmd Command) error {
	switch cmd.Type {
	case "NOTE_CREATE":
		return s.applyCreate(cmd)
	case "NOTE_UPDATE":
		return s.applyUpdate(cmd)
	case "NOTE_DELETE":
		return s.applyDelete(cmd)
	default:
		return errors.New("unknown command type: " + cmd.Type)
	}
}

func (s *Store) ensureUser(userID string) map[string]*Note {
	m := s.users[userID]
	if m == nil {
		m = make(map[string]*Note)
		s.users[userID] = m
	}
	return m
}

func (s *Store) applyCreate(cmd Command) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	u := s.ensureUser(cmd.UserID)
	u[cmd.NoteID] = &Note{
		NoteID:      cmd.NoteID,
		Title:       cmd.Title,
		Description: cmd.Description,
		Tag:         cmd.Tag,
		UpdatedAt:   nowUTC(),
	}
	return nil
}

func (s *Store) applyUpdate(cmd Command) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	u := s.ensureUser(cmd.UserID)
	n := u[cmd.NoteID]
	if n == nil {
		n = &Note{NoteID: cmd.NoteID}
		u[cmd.NoteID] = n
	}
	if cmd.Title != "" {
		n.Title = cmd.Title
	}
	if cmd.Description != "" {
		n.Description = cmd.Description
	}
	if cmd.Tag != "" {
		n.Tag = cmd.Tag
	}
	n.UpdatedAt = nowUTC()
	return nil
}

func (s *Store) applyDelete(cmd Command) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	u := s.users[cmd.UserID]
	if u != nil {
		delete(u, cmd.NoteID)
	}
	return nil
}
