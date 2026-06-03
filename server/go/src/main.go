package main

import (
	"log"
	"net/http"

	_ "projecTea/docs"

	"projecTea/api"
	"projecTea/files"
	"projecTea/kanban"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

// main sets up services and routes
func main() {
	router := mux.NewRouter()
	fileService := files.NewFileService("./uploads")

	// Kanban service (in-memory)
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
	router.HandleFunc("/api/kanban/move", kanbanService.MoveTask).Methods(http.MethodPost)

	// Swagger UI
	router.PathPrefix("/swagger/").Handler(httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
		httpSwagger.DeepLinking(true),
		httpSwagger.DocExpansion("none"),
		httpSwagger.DomID("swagger-ui"),
	))

	// Aplikuj CORS middleware
	handler := api.CorsMiddleware(router)

	port := ":8081"
	log.Printf("Serwer plików uruchomiony na porcie %s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
