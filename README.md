# ProjecTea

ProjecTea to projekt czatu teamowego z frontendem React + Vite oraz backendem Java Spring Boot, REST + WebSocket STOMP i dodatkowymi serwisami zbudowanymi w GO.

## Architektura

- Frontend: React 19 + TypeScript + Vite (`client`)
- Backend glowny: Spring Boot 4 (`server/java`)
- Backend drugi w tym servisy GO (`server/go`)
- WebSocket: STOMP + SockJS (`/ws`, `/app/send`, `/topic/messages`)
- Dokumentacja API: Springdoc OpenAPI + Swagger UI
- Reverse proxy (dev): Nginx (`nginx/default.conf`)
- Serwis `grpcmqtt` jako most miedzy gRPC i MQTT oraz prosty klient testowy (`server/go/grpcmqtt`)

## Struktura repozytorium

```text
.
|-- client/                    # aplikacja frontendowa React
|-- server/
|   |-- java/                  # backend Spring Boot (REST + WebSocket + Swagger)
|   `-- go/                    # backend Go + demo gRPC/MQTT
|-- nginx/                     # konfiguracja reverse proxy dla trybu dev
|-- docker-compose.yml         # prostszy stack (frontend + go + java)
`-- docker-compose.dev.yml     # stack dev z nginx (HTTP/HTTPS)
```

## gRPC + MQTT

W `server/go/grpcmqtt` znajduje się prosty most `grpcmqtt`:

- gRPC: metoda `Send` oraz serwerowy stream `Subscribe`
- MQTT: służy jako warstwa wymiany wiadomości
- Docker Compose umożliwia szybkie uruchomienie `mosquitto` + `grpcmqtt` + przykładowego klienta

Jeśli potrzebujesz wygenerować `pb` ręcznie (lokalnie), możesz wykorzystać tymczasowy kontener z `protoc` i pluginami. Przykład (dostosuj ścieżkę `proj`):

```bash
proj='C:\Users\pszer\OneDrive\Dokumenty\repositories\ProjecTea\server\go\grpcmqtt'
docker run --rm -v "${proj}:/defs" -w /defs golang:1.20-alpine sh -c "apk add --no-cache protobuf bash git build-base && go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1 && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0 && mkdir -p pb && protoc --proto_path=proto --go_out=paths=source_relative:./pb --go-grpc_out=paths=source_relative:./pb proto/messages.proto"
```

## Powiadomienia (Notifications)

W projekcie znajduje się prosty system powiadomień. Powiadomienia są publikowane na MQTT topic `notifications` (przez serwis `grpcmqtt`). Na start wysyłamy:

- powiadomienia o zmianach w Kanbanie (tworzenie/przenoszenie zadań)

Jak odbierać powiadomienia:

- Subskrybuj MQTT topic `notifications` (broker `mosquitto` w Docker Compose, domyślnie port 1883).

Przykład (lokalnie, używając `mosquitto_sub`):

```bash
mosquitto_sub -h localhost -p 1883 -t notifications -v
```

Endpoint do zgłaszania nowej wiadomości czatu (możesz wywołać z backendu Java po wysłaniu wiadomości):

```bash
curl -X POST http://localhost:8081/api/notify/chat -H "Content-Type: application/json" -d '{"from":"Alice","text":"Cześć"}'
```
 
```

## Wymagania

- Docker + Docker Compose
- lub lokalnie:
	- Node.js 20+
	- Java 25 (JDK)
	- Maven (albo `mvnw` jesli dziala w srodowisku)
	- Go 1.23+

## Uruchamianie przez Docker

### 1) Pelny tryb deweloperski z Nginx

```bash
docker compose -f docker-compose.dev.yml up --build
```

Co uruchamia:

- `frontend` na porcie 8080 (wewnatrz kontenera)
- `java-backend` na porcie 8082
- `go-backend` na porcie 8081
- `nginx` na portach 80 i 443
- bazy danych oracle oraz mongo

Nginx przekierowuje:

- `/` -> frontend
- `/api/*` -> Java backend
- `/ws` -> Java backend (SockJS/WebSocket)

### 2) Uproszczony stack

```bash
docker compose up --build
```

Ten wariant uruchamia frontend + go-backend + java-backend bez Nginx.

## Uruchamianie lokalne (bez Dockera)

### Frontend

```bash
cd client
npm ci
npm run dev -- --host 0.0.0.0 --port 8080
```

### Backend Java

```bash
cd server/java
mvn spring-boot:run
```

albo:

```bash
cd server/java
./mvnw spring-boot:run
```

### Backend Go

```bash
cd server/go
go build -o app ./src
```

Szczegolowa dokumentacja: [server/go/README.md](server/go/README.md)

## Adresy i endpointy

### Java backend

- Base URL: `https://localhost:8082`
- Status: `GET /status`
- REST messages:
	- `GET /api/messages`
	- `POST /api/messages`

### Go backend

- Base URL: `https://localhost:8081`
- Upload pliku: `POST /api/files/upload`
- Pobieranie pliku: `GET /api/files/download/{fileId}`
- Listowanie plikow: `GET /api/files`
- Usuwanie pliku: `DELETE /api/files/{fileId}`

### WebSocket/STOMP

- SockJS endpoint: `/ws`
- Publish destination: `/app/send`
- Subscribe destination: `/topic/messages`

### Swagger / OpenAPI

- Swagger UI Java: `https://localhost:8082/swagger-ui/index.html`
- Swagger UI Go: `http://localhost:8081/swagger/`
- OpenAPI JSON: `https://localhost:8082/v3/api-docs`

## Walidacja requestow (POST /api/messages)

Request body jest walidowany przez DTO `CreateMessageRequest`.

Reguly:

- `from`: wymagane, od 2 do 30 znakow
- `text`: wymagane, od 1 do 500 znakow

Przy bledzie walidacji endpoint zwraca HTTP 400 z ustandaryzowanym payloadem:

```json
{
	"status": 400,
	"error": "Validation failed",
	"path": "/api/messages",
	"fieldErrors": {
		"from": "from must be between 2 and 30 characters",
		"text": "text must not be blank"
	}
}
```

## SSL i certyfikaty w dev

### Keystore dla Spring Boot

Skrypty generuja lokalny keystore PKCS12 uzywany przez backend Java.

- wynik: `server/java/src/main/resources/keystore.p12`
- haslo: `changeit`

PowerShell:

```powershell
cd server/java/scripts
.\generate_keystore.ps1
```

Bash:

```bash
cd server/java/scripts
./generate_keystore.sh
```

### Certyfikaty dla Nginx

Nginx korzysta z:

- `server/java/src/main/resources/certs/localhost.pem`
- `server/java/src/main/resources/certs/localhost-key.pem`

Sluza tylko do lokalnego developmentu.

## Testy wydajnosciowe (JMeter)

W repo znajduje sie gotowy scenariusz testu wydajnosciowego dla aplikacji JMeter: [server/jmeter/README_JMeter.md](server/jmeter/README_JMeter.md).

Krotka instrukcja uruchomienia:

1. Uruchom stack aplikacji, np. `docker compose -f docker-compose.dev.yml up --build` albo przynajmniej `docker compose -f docker-compose.dev.yml start`.
2. Otworz katalog `server/jmeter` i uruchom skrypt `run_with_truststore.ps1`, ktory importuje certyfikat i odpala JMeter z truststore.
3. Scenariusz wykonuje logowanie do `/api/auth/login`, pobiera dane z `/api/auth/me` i generuje raport HTML.
4. Wyniki testu pojawiaja sie w `server/jmeter/report/index.html`.

Jesli chcesz wykonac test recznie w trybie non-GUI, szczegoly uruchomienia i dokumentacja screenshotow sa opisane w [server/jmeter/README_JMeter.md](server/jmeter/README_JMeter.md).