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

	"github.com/gorilla/mux"
)

const (
	uploadDir     = "./uploads"
	maxUploadSize = 100 * 1024 * 1024 // 100MB
)

// FileInfo zawiera informacje o wysłanym pliku
type FileInfo struct {
	Name        string    `json:"name"`
	Size        int64     `json:"size"`
	MimeType    string    `json:"mimeType"`
	UploadAt    time.Time `json:"uploadAt"`
	FileID      string    `json:"fileId"`
	DownloadURL string    `json:"downloadUrl"`
}

// FileService obsługuje operacje na plikach
type FileService struct {
	uploadDir string
}

// NewFileService tworzy nowy serwis do obsługi plików
func NewFileService(uploadDir string) *FileService {
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("Nie można stworzyć katalogu uploads: %v", err)
	}
	return &FileService{uploadDir: uploadDir}
}

// UploadFile obsługuje upload pliku
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

	// Zwróć informacje o pliku
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

// DownloadFile obsługuje pobieranie pliku
func (fs *FileService) DownloadFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]
	filePath := filepath.Join(fs.uploadDir, fileID)

	// Sprawdzenie bezpieczeństwa - czy ścieżka nie wychodzi poza uploadDir
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

	// Wyślij plik
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(fileID)))
	http.ServeFile(w, r, filePath)
}

// ListFiles zwraca listę wszystkich plików
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

// DeleteFile usuwa plik
func (fs *FileService) DeleteFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]
	filePath := filepath.Join(fs.uploadDir, fileID)

	// Sprawdzenie bezpieczeństwa
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

// CORS middleware
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

// Pomocnicza funkcja sprawdzająca czy ścieżka jest w danym katalogu
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
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"healthy"}`)
	}).Methods(http.MethodGet)

	// Aplikuj CORS middleware
	handler := corsMiddleware(router)

	port := ":8081"
	log.Printf("Serwer plików uruchomiony na porcie %s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
