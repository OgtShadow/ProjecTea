package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "projecTea/docs"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title ProjecTea File Service API
// @version 1.0
// @description API do zarządzania plikami wysyłanymi przez użytkowników na czacie
// @host localhost:8081
// @basePath /
// @schemes http https

const (
	uploadDir     = "./uploads"
	maxUploadSize = 100 * 1024 * 1024 // 100MB
)

// @Description Informacje o pliku w systemie
type FileInfo struct {
	Name        string    `json:"name" example:"document.pdf" description:"Nazwa oryginalnego pliku"`
	Size        int64     `json:"size" example:"1024000" description:"Rozmiar pliku w bajtach"`
	MimeType    string    `json:"mimeType" example:"application/pdf" description:"Typ MIME pliku"`
	UploadAt    time.Time `json:"uploadAt" example:"2026-04-29T10:30:00Z" description:"Data i czas wysłania pliku"`
	FileID      string    `json:"fileId" example:"1704067800000000000_document.pdf" description:"Unikalny identyfikator pliku w systemie"`
	DownloadURL string    `json:"downloadUrl" example:"/api/files/download/1704067800000000000_document.pdf" description:"URL do pobrania pliku"`
}

type FileService struct {
	uploadDir string
}

func NewFileService(uploadDir string) *FileService {
	absUploadDir, err := filepath.Abs(uploadDir)
	if err != nil {
		log.Fatalf("Nie można ustalić bezwzględnej ścieżki uploads: %v", err)
	}

	if err := os.MkdirAll(absUploadDir, 0755); err != nil {
		log.Fatalf("Nie można stworzyć katalogu uploads: %v", err)
	}
	return &FileService{uploadDir: absUploadDir}
}

// @Summary Przesyłanie pliku
// @Description Pozwala na przesłanie pliku do serwera. Maksymalny rozmiar pliku to 100MB. Plik otrzymuje unikalny identyfikator opparty na czasowniku nanosekund i nazwie oryginału.
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Plik do przesłania"
// @Success 200 {object} map[string]interface{} "Plik pomyślnie przesłany"
// @Failure 400 {object} map[string]string "Błąd: brak pliku lub plik za duży"
// @Failure 500 {object} map[string]string "Błąd serwera"
// @Router /api/files/upload [post]
// @Tags Files
func (fs *FileService) UploadFile(w http.ResponseWriter, r *http.Request) {
	// Ustaw limit rozmiaru
	r.ParseMultipartForm(maxUploadSize)

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Nie można odczytać pliku", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Walidacja rozmiaru
	if fileHeader.Size > maxUploadSize {
		http.Error(w, "Plik za duży", http.StatusBadRequest)
		return
	}

	// Generuj unikalną nazwę pliku
	fileID := fmt.Sprintf("%d_%s", time.Now().UnixNano(), fileHeader.Filename)
	filePath := filepath.Join(fs.uploadDir, fileID)

	// Stwórz plik docelowy
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Nie można stworzyć pliku", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Skopiuj zawartość
	_, err = io.Copy(dst, file)
	if err != nil {
		os.Remove(filePath)
		http.Error(w, "Błąd podczas zapisu pliku", http.StatusInternalServerError)
		return
	}

	fileInfo := FileInfo{
		Name:        fileHeader.Filename,
		Size:        fileHeader.Size,
		MimeType:    fileHeader.Header.Get("Content-Type"),
		UploadAt:    time.Now(),
		FileID:      fileID,
		DownloadURL: fmt.Sprintf("/api/files/download/%s", fileID),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"file":    fileInfo,
	})
}

// @Summary Pobieranie pliku
// @Description Pozwala na pobranie pliku na podstawie jego identyfikatora. Plik jest zwracany jako załącznik do pobrania.
// @Produce octet-stream
// @Param fileId path string true "Identyfikator pliku" example:"1704067800000000000_document.pdf"
// @Success 200 {file} binary "Plik pomyślnie pobierany"
// @Failure 404 {object} map[string]string "Plik nie znaleziony"
// @Router /api/files/download/{fileId} [get]
// @Tags Files
func (fs *FileService) DownloadFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]
	filePath := filepath.Join(fs.uploadDir, fileID)

	cleanPath, err := filepath.Abs(filePath)
	if err != nil || !isPathInDir(cleanPath, fs.uploadDir) {
		http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
		return
	}

	info, err := os.Stat(filePath)
	if err != nil || info.IsDir() {
		http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(fileID)))
	http.ServeFile(w, r, filePath)
}

// @Summary Lista wszystkich plików
// @Description Zwraca listę wszystkich plików przesłanych do serwera. Zawiera informacje o każdym pliku takie jak nazwa, rozmiar, data wysłania i URL do pobrania.
// @Produce json
// @Success 200 {object} map[string][]FileInfo "Lista plików"
// @Failure 500 {object} map[string]string "Błąd serwera"
// @Router /api/files [get]
// @Tags Files
func (fs *FileService) ListFiles(w http.ResponseWriter, r *http.Request) {
	files, err := os.ReadDir(fs.uploadDir)
	if err != nil {
		http.Error(w, "Błąd podczas czytania katalogu", http.StatusInternalServerError)
		return
	}

	var fileInfos []FileInfo
	for _, file := range files {
		if !file.IsDir() {
			info, _ := file.Info()
			fileInfos = append(fileInfos, FileInfo{
				Name:        filepath.Base(file.Name()),
				Size:        info.Size(),
				UploadAt:    info.ModTime(),
				FileID:      file.Name(),
				DownloadURL: fmt.Sprintf("/api/files/download/%s", file.Name()),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"files": fileInfos,
	})
}

// @Summary Usuwanie pliku
// @Description Pozwala na usunięcie pliku z serwera na podstawie jego identyfikatora. Po usunięciu plik nie będzie dostępny do pobrania.
// @Produce json
// @Param fileId path string true "Identyfikator pliku" example:"1704067800000000000_document.pdf"
// @Success 200 {object} map[string]bool "Plik pomyślnie usunięty"
// @Failure 404 {object} map[string]string "Plik nie znaleziony"
// @Failure 500 {object} map[string]string "Błąd serwera"
// @Router /api/files/{fileId} [delete]
// @Tags Files
func (fs *FileService) DeleteFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]
	filePath := filepath.Join(fs.uploadDir, fileID)

	cleanPath, err := filepath.Abs(filePath)
	if err != nil || !isPathInDir(cleanPath, fs.uploadDir) {
		http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
		return
	}

	err = os.Remove(filePath)
	if err != nil {
		http.Error(w, "Nie można usunąć pliku", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"success":true}`)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isPathInDir(fullPath, dir string) bool {
	rel, err := filepath.Rel(dir, fullPath)
	if err != nil {
		return false
	}
	return !filepath.IsAbs(rel) && rel != ".." && !filepath.HasPrefix(rel, "..")
}

func main() {
	router := mux.NewRouter()
	fileService := NewFileService(uploadDir)

	// API endpoints dla plików
	router.HandleFunc("/api/files/upload", fileService.UploadFile).Methods(http.MethodPost)
	router.HandleFunc("/api/files", fileService.ListFiles).Methods(http.MethodGet)
	router.HandleFunc("/api/files/download/{fileId}", fileService.DownloadFile).Methods(http.MethodGet)
	router.HandleFunc("/api/files/{fileId}", fileService.DeleteFile).Methods(http.MethodDelete)

	// Health check
	// @Summary Sprawdzenie zdrowotności serwera
	// @Description Prosty endpoint do sprawdzenia, czy serwer jest dostępny i działający prawidłowo
	// @Produce json
	// @Success 200 {object} map[string]string "Serwer działa poprawnie"
	// @Router /health [get]
	// @Tags Health
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"healthy"}`)
	}).Methods(http.MethodGet)

	// Swagger UI
	router.PathPrefix("/swagger/").Handler(httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
		httpSwagger.DeepLinking(true),
		httpSwagger.DocExpansion("none"),
		httpSwagger.DomID("swagger-ui"),
	))

	// Aplikuj CORS middleware
	handler := corsMiddleware(router)

	port := ":8081"
	log.Printf("Serwer plików uruchomiony na porcie %s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
