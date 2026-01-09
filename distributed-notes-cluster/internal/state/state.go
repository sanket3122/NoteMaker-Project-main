package state

import "time"

type Note struct {
	NoteID      string `json:"note_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Tag         string `json:"tag"`
	UpdatedAt   string `json:"updated_at"`
}

type UserState struct {
	Notes map[string]*Note `json:"notes"`
}

type AppState struct {
	Users map[string]*UserState `json:"users"`
}

func NewAppState() *AppState {
	return &AppState{
		Users: make(map[string]*UserState),
	}
}

func (s *AppState) EnsureUser(userID string) *UserState {
	u, ok := s.Users[userID]
	if !ok {
		u = &UserState{Notes: make(map[string]*Note)}
		s.Users[userID] = u
	}
	return u
}

func NowUTC() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}
