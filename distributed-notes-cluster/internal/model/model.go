package model

import "time"

type CommandType string

const (
	CmdNoteCreate CommandType = "NOTE_CREATE"
	CmdNoteUpdate CommandType = "NOTE_UPDATE"
	CmdNoteDelete CommandType = "NOTE_DELETE"
)

type Command struct {
	Type        CommandType `json:"type"`
	UserID      string      `json:"user_id"`
	NoteID      string      `json:"note_id"`
	Title       string      `json:"title,omitempty"`
	Description string      `json:"description,omitempty"`
	Tag         string      `json:"tag,omitempty"`
}

type LogEntry struct {
	Index   int       `json:"index"`
	Term    uint64    `json:"term"`
	Command Command   `json:"command"`
	TimeUTC time.Time `json:"time_utc"`
}
