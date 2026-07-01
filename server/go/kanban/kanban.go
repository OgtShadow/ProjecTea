package kanban

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"projecTea/notifications"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/gorilla/mux"
	pb "github.com/projecTea/grpcmqtt/pb"
	"google.golang.org/grpc"
)

type Task struct {
	ID          string `json:"id" bson:"id"`
	Title       string `json:"title" bson:"title"`
	Description string `json:"description,omitempty" bson:"description,omitempty"`
	DueDate     string `json:"dueDate,omitempty" bson:"dueDate,omitempty"`
	Assignee    string `json:"assignee,omitempty" bson:"assignee,omitempty"`
}

type KanbanBoard struct {
	Columns map[string][]Task `json:"columns"`
}

type KanbanService struct {
	mu         sync.Mutex
	collection *mongo.Collection
	grpcClient pb.MessageServiceClient
	topic      string
}

const boardDocumentID = "main_board"

// NewKanbanService creates service and connects to MQTT broker (if configured)
func NewKanbanService() *KanbanService {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://admin:adminpassword@mongodb:27017/projectea_nosql?authSource=admin"
	}

	dbName := os.Getenv("MONGODB_DATABASE")
	if dbName == "" {
		dbName = "projectea_nosql"
	}

	collectionName := os.Getenv("MONGODB_KANBAN_COLLECTION")
	if collectionName == "" {
		collectionName = "kanban"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Nie udało się połączyć z MongoDB dla Kanbana: %v", err))
	}

	collection := mongoClient.Database(dbName).Collection(collectionName)
	initDefaultBoard(ctx, collection)

	ks := &KanbanService{collection: collection, topic: "kanban/updates"}

	// connect to grpcmqtt service
	grpcAddr := os.Getenv("KANBAN_GRPC_ADDR")
	if grpcAddr == "" {
		grpcAddr = "grpcmqtt:50051"
	}
	// try connect with short timeout (non-fatal)
	gctx, gcancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer gcancel()
	conn, err := grpc.DialContext(gctx, grpcAddr, grpc.WithInsecure(), grpc.WithBlock())
	if err == nil {
		ks.grpcClient = pb.NewMessageServiceClient(conn)
	}

	return ks
}

func initDefaultBoard(ctx context.Context, coll *mongo.Collection) {
	err := coll.FindOne(ctx, bson.M{"_id": boardDocumentID}).Err()
	if !errors.Is(err, mongo.ErrNoDocuments) {
		return
	}

	b := KanbanBoard{Columns: map[string][]Task{
		"todo":       {{ID: fmt.Sprintf("%d", time.Now().UnixNano()), Title: "Przykładowe zadanie 1"}},
		"inprogress": {{ID: fmt.Sprintf("%d", time.Now().UnixNano()+1), Title: "Przykładowe zadanie 2"}},
		"done":       {},
		"trash":      {},
	}}

	_, _ = coll.InsertOne(ctx, bson.M{"_id": boardDocumentID, "columns": b.Columns})
}

func normalizeColumns(columns map[string][]Task) map[string][]Task {
	if columns == nil {
		columns = make(map[string][]Task)
	}
	if _, ok := columns["todo"]; !ok {
		columns["todo"] = []Task{}
	}
	if _, ok := columns["inprogress"]; !ok {
		columns["inprogress"] = []Task{}
	}
	if _, ok := columns["done"]; !ok {
		columns["done"] = []Task{}
	}
	if _, ok := columns["trash"]; !ok {
		columns["trash"] = []Task{}
	}
	return columns
}

func (ks *KanbanService) getBoardFromDB(ctx context.Context) (KanbanBoard, error) {
	var doc struct {
		Columns map[string][]Task `bson:"columns"`
	}
	err := ks.collection.FindOne(ctx, bson.M{"_id": boardDocumentID}).Decode(&doc)
	if err != nil {
		return KanbanBoard{}, err
	}

	return KanbanBoard{Columns: normalizeColumns(doc.Columns)}, nil
}

func (ks *KanbanService) saveBoard(ctx context.Context, board KanbanBoard) error {
	_, err := ks.collection.UpdateOne(
		ctx,
		bson.M{"_id": boardDocumentID},
		bson.M{"$set": bson.M{"columns": board.Columns}},
	)
	return err
}

// GET /api/kanban
func (ks *KanbanService) GetBoard(w http.ResponseWriter, r *http.Request) {
	ks.mu.Lock()
	defer ks.mu.Unlock()

	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		http.Error(w, "Błąd odczytu Kanban z bazy danych", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(board)
}

// POST /api/kanban/tasks  { title, description, column, dueDate, assignee }
func (ks *KanbanService) CreateTask(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Column      string `json:"column"`
		DueDate     string `json:"dueDate"`
		Assignee    string `json:"assignee"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if payload.Title == "" {
		http.Error(w, "title required", http.StatusBadRequest)
		return
	}

	dueDate := strings.TrimSpace(payload.DueDate)
	if dueDate != "" {
		if _, err := time.Parse("2006-01-02", dueDate); err != nil {
			http.Error(w, "dueDate must be in format YYYY-MM-DD", http.StatusBadRequest)
			return
		}
	}

	assignee := strings.TrimSpace(payload.Assignee)

	ks.mu.Lock()
	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		ks.mu.Unlock()
		http.Error(w, "Błąd odczytu Kanban z bazy danych", http.StatusInternalServerError)
		return
	}

	id := fmt.Sprintf("%d", time.Now().UnixNano())
	task := Task{
		ID:          id,
		Title:       payload.Title,
		Description: payload.Description,
		DueDate:     dueDate,
		Assignee:    assignee,
	}
	col := payload.Column
	if col == "" {
		col = "todo"
	}
	board.Columns[col] = append(board.Columns[col], task)

	if err := ks.saveBoard(r.Context(), board); err != nil {
		ks.mu.Unlock()
		http.Error(w, "Nie udało się zapisać zadania w bazie danych", http.StatusInternalServerError)
		return
	}

	boardCopy := board
	ks.mu.Unlock()

	// publish update event via gRPC Send
	go ks.sendGRPCEvent("kanban/updates", boardCopy)
	// also send a short notification
	go func() {
		_ = notify("kanban.create", map[string]any{"task": task, "column": col})
	}()

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
	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		ks.mu.Unlock()
		http.Error(w, "Błąd odczytu Kanban z bazy danych", http.StatusInternalServerError)
		return
	}

	from := payload.FromColumn
	to := payload.ToColumn
	var moved Task
	found := false
	if arr, ok := board.Columns[from]; ok {
		for i, t := range arr {
			if t.ID == payload.TaskID {
				moved = t
				board.Columns[from] = append(arr[:i], arr[i+1:]...)
				found = true
				break
			}
		}
	}
	if !found {
		ks.mu.Unlock()
		http.Error(w, "task not found in fromColumn", http.StatusBadRequest)
		return
	}
	dst := board.Columns[to]
	idx := payload.ToIndex
	if idx < 0 || idx > len(dst) {
		idx = len(dst)
	}
	newDst := append(dst[:idx], append([]Task{moved}, dst[idx:]...)...)
	board.Columns[to] = newDst

	if err := ks.saveBoard(r.Context(), board); err != nil {
		ks.mu.Unlock()
		http.Error(w, "Nie udało się zapisać zmian Kanban w bazie danych", http.StatusInternalServerError)
		return
	}

	boardCopy := board
	ks.mu.Unlock()

	// publish move event via gRPC Send
	go ks.sendGRPCEvent("kanban/updates", boardCopy)
	// also send a short notification
	go func() {
		_ = notify("kanban.move", map[string]any{"task": moved, "from": from, "to": to})
	}()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true})
}

// DELETE /api/kanban/tasks/{taskId}
func (ks *KanbanService) DeleteTask(w http.ResponseWriter, r *http.Request) {
	taskID := mux.Vars(r)["taskId"]
	if taskID == "" {
		http.Error(w, "taskId required", http.StatusBadRequest)
		return
	}

	ks.mu.Lock()
	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		ks.mu.Unlock()
		http.Error(w, "Błąd odczytu Kanban z bazy danych", http.StatusInternalServerError)
		return
	}

	found := false
	for colName, tasks := range board.Columns {
		for i, t := range tasks {
			if t.ID == taskID {
				board.Columns[colName] = append(tasks[:i], tasks[i+1:]...)
				found = true
				break
			}
		}
		if found {
			break
		}
	}

	if !found {
		ks.mu.Unlock()
		http.Error(w, "task not found", http.StatusNotFound)
		return
	}

	if err := ks.saveBoard(r.Context(), board); err != nil {
		ks.mu.Unlock()
		http.Error(w, "Nie udało się usunąć zadania z bazy danych", http.StatusInternalServerError)
		return
	}

	boardCopy := board
	ks.mu.Unlock()

	go ks.sendGRPCEvent("kanban/updates", boardCopy)
	go func() {
		_ = notify("kanban.delete", map[string]any{"taskId": taskID})
	}()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true})
}

func (ks *KanbanService) sendGRPCEvent(topic string, board KanbanBoard) {
	if ks.grpcClient == nil {
		return
	}
	ev := map[string]any{"board": board}
	b, _ := json.Marshal(ev)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	_, _ = ks.grpcClient.Send(ctx, &pb.Message{Topic: topic, Payload: string(b)})
}

func notify(eventType string, payload any) error {
	return notifications.Notify(eventType, payload)
}
