package wal

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"distributed-notes-cluster/internal/model"
)

type WAL struct {
	mu sync.Mutex

	dir      string
	logPath  string
	metaPath string
	logFile  *os.File
	writer   *bufio.Writer
}

type meta struct {
	CurrentTerm uint64 `json:"current_term"`
	VotedFor    string `json:"voted_for"`
}

func New(dir string) (*WAL, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}

	w := &WAL{
		dir:      dir,
		logPath:  filepath.Join(dir, "log.jsonl"),
		metaPath: filepath.Join(dir, "state.json"),
	}

	f, err := os.OpenFile(w.logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return nil, err
	}
	w.logFile = f
	w.writer = bufio.NewWriterSize(f, 1<<20)

	return w, nil
}

func (w *WAL) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.writer != nil {
		_ = w.writer.Flush()
	}
	if w.logFile != nil {
		return w.logFile.Close()
	}
	return nil
}

func (w *WAL) Append(entry model.LogEntry) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	b, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	if _, err := w.writer.Write(append(b, '\n')); err != nil {
		return err
	}
	return w.writer.Flush()
}

func (w *WAL) LoadLog() ([]model.LogEntry, error) {
	f, err := os.OpenFile(w.logPath, os.O_CREATE|os.O_RDONLY, 0o644)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 10*1024*1024)

	var out []model.LogEntry
	for sc.Scan() {
		var e model.LogEntry
		if err := json.Unmarshal(sc.Bytes(), &e); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, sc.Err()
}

func (w *WAL) SaveMeta(term uint64, votedFor string) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	m := meta{CurrentTerm: term, VotedFor: votedFor}
	b, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(w.metaPath, b, 0o644)
}

func (w *WAL) LoadMeta() (term uint64, votedFor string, ok bool, err error) {
	b, err := os.ReadFile(w.metaPath)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, "", false, nil
		}
		return 0, "", false, err
	}
	var m meta
	if err := json.Unmarshal(b, &m); err != nil {
		return 0, "", false, err
	}
	return m.CurrentTerm, m.VotedFor, true, nil
}
