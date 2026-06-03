package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Simple in-memory Kanban
type Task struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

type KanbanBoard struct {
	Columns map[string][]Task `json:"columns"`
}

type KanbanService struct {
	mu    sync.Mutex
	board KanbanBoard
}

func NewKanbanService() *KanbanService {
	b := KanbanBoard{Columns: map[string][]Task{
		"todo":       {{ID: fmt.Sprintf("%d", time.Now().UnixNano()), Title: "Przykładowe zadanie 1"}},
		"inprogress": {{ID: fmt.Sprintf("%d", time.Now().UnixNano()+1), Title: "Przykładowe zadanie 2"}},
		"done":       {},
	}}
	return &KanbanService{board: b}
}

// GET /api/kanban
func (ks *KanbanService) GetBoard(w http.ResponseWriter, r *http.Request) {
	ks.mu.Lock()
	defer ks.mu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(ks.board)
}

// POST /api/kanban/tasks  { title, description, column }
func (ks *KanbanService) CreateTask(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Column      string `json:"column"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if payload.Title == "" {
		http.Error(w, "title required", http.StatusBadRequest)
		return
	}
	ks.mu.Lock()
	defer ks.mu.Unlock()
	id := fmt.Sprintf("%d", time.Now().UnixNano())
	task := Task{ID: id, Title: payload.Title, Description: payload.Description}
	col := payload.Column
	if col == "" {
		col = "todo"
	}
	ks.board.Columns[col] = append(ks.board.Columns[col], task)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(task)
}

// POST /api/kanban/move   { taskId, fromColumn, toColumn, toIndex }
func (ks *KanbanService) MoveTask(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TaskID     string `json:"taskId"`
		FromColumn string `json:"fromColumn"`
		ToColumn   string `json:"toColumn"`
		ToIndex    int    `json:"toIndex"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	ks.mu.Lock()
	defer ks.mu.Unlock()

	from := payload.FromColumn
	to := payload.ToColumn
	var moved Task
	found := false
	if arr, ok := ks.board.Columns[from]; ok {
		for i, t := range arr {
			if t.ID == payload.TaskID {
				moved = t
				ks.board.Columns[from] = append(arr[:i], arr[i+1:]...)
				found = true
				break
			}
		}
	}
	if !found {
		http.Error(w, "task not found in fromColumn", http.StatusBadRequest)
		return
	}
	dst := ks.board.Columns[to]
	idx := payload.ToIndex
	if idx < 0 || idx > len(dst) {
		idx = len(dst)
	}
	newDst := append(dst[:idx], append([]Task{moved}, dst[idx:]...)...)
	ks.board.Columns[to] = newDst

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true})
}
