package files

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
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
	bucket    *gridfs.Bucket
	filesColl *mongo.Collection
}

func NewFileService(uploadDir string) *FileService {
	_ = uploadDir // Backward compatibility: constructor signature kept unchanged.

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://admin:adminpassword@mongodb:27017/projectea_nosql?authSource=admin"
	}

	dbName := os.Getenv("MONGODB_DATABASE")
	if dbName == "" {
		dbName = "projectea_nosql"
	}

	bucketName := os.Getenv("MONGODB_FILES_BUCKET")
	if bucketName == "" {
		bucketName = "uploads"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Nie można połączyć się z MongoDB: %v", err)
	}

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("MongoDB nie odpowiada: %v", err)
	}

	db := client.Database(dbName)
	bucket, err := gridfs.NewBucket(db, options.GridFSBucket().SetName(bucketName))
	if err != nil {
		log.Fatalf("Nie można utworzyć bucketu GridFS: %v", err)
	}

	return &FileService{
		bucket:    bucket,
		filesColl: db.Collection(bucketName + ".files"),
	}
}

func (fs *FileService) UploadFile(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, "Nie można przetworzyć formularza", http.StatusBadRequest)
		return
	}

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
	uploadedAt := time.Now()

	uploadStream, err := fs.bucket.OpenUploadStreamWithID(
		fileID,
		fileID,
		options.GridFSUpload().SetMetadata(bson.M{
			"originalName": fileHeader.Filename,
			"mimeType":     fileHeader.Header.Get("Content-Type"),
			"uploadAt":     uploadedAt,
		}),
	)
	if err != nil {
		http.Error(w, "Nie można utworzyć upload stream", http.StatusInternalServerError)
		return
	}

	if _, err := io.Copy(uploadStream, file); err != nil {
		_ = uploadStream.Close()
		_ = fs.bucket.Delete(fileID)
		http.Error(w, "Błąd podczas zapisu pliku", http.StatusInternalServerError)
		return
	}

	if err := uploadStream.Close(); err != nil {
		_ = fs.bucket.Delete(fileID)
		http.Error(w, "Błąd podczas finalizacji zapisu", http.StatusInternalServerError)
		return
	}

	fileInfo := FileInfo{
		Name:        fileHeader.Filename,
		Size:        fileHeader.Size,
		MimeType:    fileHeader.Header.Get("Content-Type"),
		UploadAt:    uploadedAt,
		FileID:      fileID,
		DownloadURL: fmt.Sprintf("/api/files/download/%s", fileID),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true, "file": fileInfo})
}

func (fs *FileService) DownloadFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	var doc struct {
		Filename string `bson:"filename"`
		Length   int64  `bson:"length"`
		Metadata struct {
			OriginalName string `bson:"originalName"`
			MimeType     string `bson:"mimeType"`
		} `bson:"metadata"`
	}

	if err := fs.filesColl.FindOne(ctx, bson.M{"_id": fileID}).Decode(&doc); err != nil {
		http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
		return
	}

	downloadStream, err := fs.bucket.OpenDownloadStream(fileID)
	if err != nil {
		http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
		return
	}
	defer downloadStream.Close()

	originalName := doc.Metadata.OriginalName
	if originalName == "" {
		originalName = doc.Filename
	}

	if doc.Metadata.MimeType != "" {
		w.Header().Set("Content-Type", doc.Metadata.MimeType)
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	if doc.Length > 0 {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", doc.Length))
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, originalName))
	if _, err := io.Copy(w, downloadStream); err != nil {
		http.Error(w, "Błąd podczas pobierania pliku", http.StatusInternalServerError)
		return
	}
}

func (fs *FileService) ListFiles(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	cursor, err := fs.filesColl.Find(ctx, bson.D{}, options.Find().SetSort(bson.D{{Key: "uploadDate", Value: -1}}))
	if err != nil {
		http.Error(w, "Błąd podczas pobierania listy plików", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var fileInfos []FileInfo
	for cursor.Next(ctx) {
		var doc struct {
			ID       string    `bson:"_id"`
			Filename string    `bson:"filename"`
			Length   int64     `bson:"length"`
			UploadAt time.Time `bson:"uploadDate"`
			Metadata struct {
				MimeType string    `bson:"mimeType"`
				UploadAt time.Time `bson:"uploadAt"`
			} `bson:"metadata"`
		}

		if err := cursor.Decode(&doc); err != nil {
			continue
		}

		uploadedAt := doc.UploadAt
		if !doc.Metadata.UploadAt.IsZero() {
			uploadedAt = doc.Metadata.UploadAt
		}

		fileInfos = append(fileInfos, FileInfo{
			Name:        doc.Filename,
			Size:        doc.Length,
			MimeType:    doc.Metadata.MimeType,
			UploadAt:    uploadedAt,
			FileID:      doc.ID,
			DownloadURL: fmt.Sprintf("/api/files/download/%s", doc.ID),
		})
	}

	if err := cursor.Err(); err != nil {
		http.Error(w, "Błąd podczas odczytu plików", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"files": fileInfos})
}

func (fs *FileService) DeleteFile(w http.ResponseWriter, r *http.Request) {
	fileID := mux.Vars(r)["fileId"]

	if err := fs.bucket.Delete(fileID); err != nil {
		if err == mongo.ErrNoDocuments || err == gridfs.ErrFileNotFound {
			http.Error(w, "Plik nie znaleziony", http.StatusNotFound)
			return
		}
		http.Error(w, "Nie można usunąć pliku", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"success":true}`)
}
