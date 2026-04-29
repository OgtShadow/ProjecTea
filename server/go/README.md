# ProjecTea File Server (Go)

Serwer Go obsługujący wysyłanie, pobieranie i zarządzanie plikami dla czatu ProjecTea.

## Funkcjonalności

- ✅ Upload plików (multipart/form-data)
- ✅ Pobieranie plików
- ✅ Listowanie dostępnych plików
- ✅ Usuwanie plików
- ✅ Zabezpieczenie przed directory traversal
- ✅ CORS support
- ✅ Limit rozmiaru pliku (100MB)

## API Endpoints

### Upload pliku
```
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: [binary]

Response:
{
  "success": true,
  "file": {
    "name": "dokument.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadAt": "2026-04-29T12:00:00Z",
    "fileId": "1714398000000_dokument.pdf",
    "downloadUrl": "/api/files/download/1714398000000_dokument.pdf"
  }
}
```

### Pobieranie pliku
```
GET /api/files/download/{fileId}

Response: [binary file content]
```

### Listowanie plików
```
GET /api/files

Response:
{
  "files": [
    {
      "name": "dokument.pdf",
      "size": 1024000,
      "uploadAt": "2026-04-29T12:00:00Z",
      "fileId": "1714398000000_dokument.pdf",
      "downloadUrl": "/api/files/download/1714398000000_dokument.pdf"
    }
  ]
}
```

### Usuwanie pliku
```
DELETE /api/files/{fileId}

Response:
{
  "success": true
}
```

## Budowanie i uruchamianie

### Lokalne

```bash
cd server/go
go mod download
go run ./src/main.go
```

Server będzie dostępny na `http://localhost:8081`

### Docker

```bash
docker-compose build go-backend
docker-compose up go-backend
```

## Konfiguracja

| Zmienna Środowiska | Opis | Domyślna |
|---|---|---|
| `UPLOADS_DIR` | Katalog dla uploadów | `./uploads` |
| Port | Port serwera | `8080` (w kontenerze) |

## Frontend Integration

W komponencie `messageSender.tsx` wysyłanie plików odbywa się przez:

```typescript
const response = await fetch('https://localhost:8081/api/files/upload', {
  method: 'POST',
  body: formData,
})
```

Po pomyślnym wysłaniu, informacja o pliku jest wysłana przez WebSocket jako wiadomość tekstowa.

## Bezpieczeństwo

- ✅ Walidacja rozmiaru pliku (max 100MB)
- ✅ Zabezpieczenie przed directory traversal (czyszczenie ścieżek)
- ✅ Unique file IDs (timestamp + original name)
- ✅ CORS ograniczone do potrzebnych metod
- ⚠️ TODO: Autentykacja JWT
- ⚠️ TODO: Skanowanie wirusów (Clamav)
- ⚠️ TODO: Rate limiting

## TODO

- [ ] Dodać autentykację JWT z Java backend'u
- [ ] Skanowanie wirusów przed zapisem
- [ ] Rate limiting dla uploadów
- [ ] Kompresja plików archiwów
- [ ] Metadata przechowywanie w bazie danych
- [ ] Backup strategie dla plików
- [ ] WebSocket integration dla notyfikacji uploadów
- [ ] Obróbka obrazów (resize, compression)

## Development

```bash
# Zainstalować dependencies
go mod tidy

# Budować
go build -o app ./src

# Testować
go test ./...

# Format kodu
go fmt ./...
```

## Troubleshooting

### Problem: CORS Error
Upewnij się że frontend łączy się z poprawnym hostem/portem.

### Problem: File not found error  
Sprawdzić czy katalog `./uploads` istnieje i ma odpowiednie uprawnienia.

### Problem: File too large
Limit to 100MB - zmień `maxUploadSize` w `main.go` jeśli potrzeba większych plików.
