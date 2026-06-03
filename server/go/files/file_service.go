package files

import (
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "time"

    "projecTea/api"

    "github.com/gorilla/mux"
)

const (
    maxUploadSize = 100 * 1024 * 1024 // 100MB
)

// FileInfo contains metadata about uploaded file
type FileInfo struct {
    Name        string    `json:"name"`
    Size        int64     `json:"size"`
    MimeType    string    `json:"mimeType"`
    UploadAt    time.Time `json:"uploadAt"`
    FileID      string    `json:"fileId"`
    DownloadURL string    `json:"downloadUrl"`
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

func (fs *FileService) UploadFile(w http.ResponseWriter, r *http.Request) {
    r.ParseMultipartForm(maxUploadSize)

    file, fileHeader, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Nie można odczytać pliku", http.StatusBadRequest)
        return
    }
    defer file.Close()

    if fileHeader.Size > maxUploadSize {
        http.Error(w, "Plik za duży", http.StatusBadRequest)
        return
    }

    fileID := fmt.Sprintf("%d_%s", time.Now().UnixNano(), fileHeader.Filename)
    filePath := filepath.Join(fs.uploadDir, fileID)

    dst, err := os.Create(filePath)
    if err != nil {
        http.Error(w, "Nie można stworzyć pliku", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

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
    _ = json.NewEncoder(w).Encode(map[string]any{"success": true, "file": fileInfo})
}

func (fs *FileService) DownloadFile(w http.ResponseWriter, r *http.Request) {
    fileID := mux.Vars(r)["fileId"]
    filePath := filepath.Join(fs.uploadDir, fileID)

    cleanPath, err := filepath.Abs(filePath)
    if err != nil || !api.IsPathInDir(cleanPath, fs.uploadDir) {
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
    _ = json.NewEncoder(w).Encode(map[string]any{"files": fileInfos})
}

func (fs *FileService) DeleteFile(w http.ResponseWriter, r *http.Request) {
    fileID := mux.Vars(r)["fileId"]
    filePath := filepath.Join(fs.uploadDir, fileID)

    cleanPath, err := filepath.Abs(filePath)
    if err != nil || !api.IsPathInDir(cleanPath, fs.uploadDir) {
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
