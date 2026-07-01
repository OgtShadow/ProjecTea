package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	_ "projecTea/docs"

	"projecTea/api"
	"projecTea/files"
	"projecTea/kanban"
	"projecTea/notifications"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	router := mux.NewRouter()
	fileService := files.NewFileService("./uploads")
	kanbanService := kanban.NewKanbanService()

	// API endpoints dla plików
	router.HandleFunc("/api/files/upload", fileService.UploadFile).Methods(http.MethodPost)
	router.HandleFunc("/api/files", fileService.ListFiles).Methods(http.MethodGet)
	router.HandleFunc("/api/files/download/{fileId}", fileService.DownloadFile).Methods(http.MethodGet)
	router.HandleFunc("/api/files/{fileId}", fileService.DeleteFile).Methods(http.MethodDelete)
	router.HandleFunc("/health", api.Health).Methods(http.MethodGet)

	// Kanban endpoints
	router.HandleFunc("/api/kanban", kanbanService.GetBoard).Methods(http.MethodGet)
	router.HandleFunc("/api/kanban/tasks", kanbanService.CreateTask).Methods(http.MethodPost)
	router.HandleFunc("/api/kanban/tasks/{taskId}", kanbanService.DeleteTask).Methods(http.MethodDelete)
	router.HandleFunc("/api/kanban/move", kanbanService.MoveTask).Methods(http.MethodPost)

	// Chat notification webhook
	router.HandleFunc("/api/notify/chat", func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			From string `json:"from"`
			Text string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		_ = notifications.Notify("chat.message", map[string]any{"from": payload.From, "text": payload.Text})
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}).Methods(http.MethodPost)

	// Swagger UI
	router.PathPrefix("/swagger/").Handler(httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
		httpSwagger.DeepLinking(true),
		httpSwagger.DocExpansion("none"),
		httpSwagger.DomID("swagger-ui"),
	))

	// Server-Sent Events endpoint for notifications (streams messages from grpcmqtt)
	router.HandleFunc("/api/notifications/stream", func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		events := notifications.Subscribe(r.Context())
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-r.Context().Done():
				return
			case event, ok := <-events:
				if !ok {
					return
				}
				b, _ := json.Marshal(event)
				_, _ = w.Write([]byte("data: "))
				_, _ = w.Write(b)
				_, _ = w.Write([]byte("\n\n"))
				flusher.Flush()
			case <-ticker.C:
				_, _ = w.Write([]byte(": keepalive\n\n"))
				flusher.Flush()
			default:
				time.Sleep(100 * time.Millisecond)
			}
		}
	}).Methods(http.MethodGet)
	handler := api.CorsMiddleware(router)

	port := ":8081"
	log.Printf("Serwer uruchomiony na porcie %s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
