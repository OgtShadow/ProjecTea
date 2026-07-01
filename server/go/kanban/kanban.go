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

	"github.com/gorilla/mux" // <--- TEN IMPORT BYŁ POTRZEBNY
	pb "github.com/projecTea/grpcmqtt/pb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/grpc"
)

// Task reprezentuje pojedyncze zadanie w bazie i JSONie
type Task struct {
	ID          string `json:"id" bson:"id"`
	Title       string `json:"title" bson:"title"`
	Description string `json:"description,omitempty" bson:"description,omitempty"`
	DueDate     string `json:"dueDate,omitempty" bson:"dueDate,omitempty"`
	Assignee    string `json:"assignee,omitempty" bson:"assignee,omitempty"`
}

// KanbanBoard grupuje zadania w kolumnach
type KanbanBoard struct {
	Columns map[string][]Task `json:"columns" bson:"columns"`
}

type KanbanService struct {
	mu         sync.Mutex
	collection *mongo.Collection
	grpcClient pb.MessageServiceClient
	topic      string
}

// NewKanbanService inicjalizuje połączenie z MongoDB oraz gRPC
func NewKanbanService() *KanbanService {
	// 1. Konfiguracja i połączenie z MongoDB
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		// Domyślny adres lokalny (taki sam jak w Java application.properties)
		mongoURI = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Nie udało się połączyć z MongoDB: %v", err))
	}

	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "projecTea"
	}
	collection := client.Database(dbName).Collection("kanban")

	// Inicjalizacja domyślnych danych startowych, jeśli baza jest pusta
	initDefaultBoard(collection)

	ks := &KanbanService{
		collection: collection,
		topic:      "kanban/updates",
	}

	// 2. Połączenie z serwisem grpcmqtt (Twój oryginalny kod)
	grpcAddr := os.Getenv("KANBAN_GRPC_ADDR")
	if grpcAddr == "" {
		grpcAddr = "grpcmqtt:50051"
	}
	gctx, gcancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer gcancel()
	conn, err := grpc.DialContext(gctx, grpcAddr, grpc.WithInsecure(), grpc.WithBlock())
	if err == nil {
		ks.grpcClient = pb.NewMessageServiceClient(conn)
	}

	return ks
}

// Funkcja pomocnicza tworząca strukturę startową w MongoDB przy pierwszym uruchomieniu
func initDefaultBoard(coll *mongo.Collection) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := coll.FindOne(ctx, bson.M{"_id": "main_board"}).Err()
	if errors.Is(err, mongo.ErrNoDocuments) {
		b := KanbanBoard{Columns: map[string][]Task{
			"todo":       {{ID: fmt.Sprintf("%d", time.Now().UnixNano()), Title: "Przykładowe zadanie 1"}},
			"inprogress": {{ID: fmt.Sprintf("%d", time.Now().UnixNano()+1), Title: "Przykładowe zadanie 2"}},
			"done":       {},
		}}
		_, _ = coll.InsertOne(ctx, bson.M{"_id": "main_board", "columns": b.Columns})
	}
}

// Pobiera aktualny stan tablicy z MongoDB
func (ks *KanbanService) getBoardFromDB(ctx context.Context) (KanbanBoard, error) {
	var doc struct {
		Columns map[string][]Task `bson:"columns"`
	}
	err := ks.collection.FindOne(ctx, bson.M{"_id": "main_board"}).Decode(&doc)
	if err != nil {
		return KanbanBoard{}, err
	}
	if doc.Columns == nil {
		doc.Columns = make(map[string][]Task)
	}
	return KanbanBoard{Columns: doc.Columns}, nil
}

// GET /api/kanban
func (ks *KanbanService) GetBoard(w http.ResponseWriter, r *http.Request) {
	ks.mu.Lock()
	defer ks.mu.Unlock()

	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		http.Error(w, "Błąd odczytu z bazy danych", http.StatusInternalServerError)
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
	if strings.TrimSpace(payload.Title) == "" {
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
	defer ks.mu.Unlock()

	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		http.Error(w, "Błąd bazy danych", http.StatusInternalServerError)
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

	// Zapis zaktualizowanej tablicy do bazy MongoDB
	_, err = ks.collection.UpdateOne(
		r.Context(),
		bson.M{"_id": "main_board"},
		bson.M{"$set": bson.M{"columns": board.Columns}},
	)
	if err != nil {
		http.Error(w, "Nie udało się zapisać zadania w bazie danych", http.StatusInternalServerError)
		return
	}

	// Publikacja zdarzenia przez gRPC/MQTT
	go ks.sendGRPCEvent("kanban/updates", board)

	// Wysłanie powiadomienia systemowego
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
	defer ks.mu.Unlock()

	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		http.Error(w, "Błąd bazy danych", http.StatusInternalServerError)
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

	// Aktualizacja całego układu kolumn w MongoDB
	_, err = ks.collection.UpdateOne(
		r.Context(),
		bson.M{"_id": "main_board"},
		bson.M{"$set": bson.M{"columns": board.Columns}},
	)
	if err != nil {
		http.Error(w, "Nie udało się zaktualizować pozycji w bazie danych", http.StatusInternalServerError)
		return
	}

	// Aktualizacja stanu przez gRPC i notyfikacje
	go ks.sendGRPCEvent("kanban/updates", board)
	go func() {
		_ = notify("kanban.move", map[string]any{"task": moved, "from": from, "to": to})
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

// DELETE /api/kanban/tasks/{taskId}
func (ks *KanbanService) DeleteTask(w http.ResponseWriter, r *http.Request) {
	ks.mu.Lock()
	defer ks.mu.Unlock()

	// Pobranie taskId z URL przy użyciu Gorilla Mux
	vars := mux.Vars(r)
	taskId := vars["taskId"]

	board, err := ks.getBoardFromDB(r.Context())
	if err != nil {
		http.Error(w, "Błąd bazy danych", http.StatusInternalServerError)
		return
	}

	found := false
	for colName, tasks := range board.Columns {
		for i, t := range tasks {
			if t.ID == taskId {
				// Usunięcie zadania ze slice'a
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
		http.Error(w, "Zadanie nie zostało znalezione", http.StatusNotFound)
		return
	}

	// Aktualizacja bazy
	_, err = ks.collection.UpdateOne(
		r.Context(),
		bson.M{"_id": "main_board"},
		bson.M{"$set": bson.M{"columns": board.Columns}},
	)
	if err != nil {
		http.Error(w, "Nie udało się usunąć zadania z bazy", http.StatusInternalServerError)
		return
	}

	go ks.sendGRPCEvent("kanban/updates", board)
	go func() {
		_ = notify("kanban.delete", map[string]any{"taskId": taskId})
	}()

	w.WriteHeader(http.StatusOK)
}
