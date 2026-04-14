# ToDo — ProjecTea

---

## Stan obecny (zrobione)
- ✅ 1. Przygotowanie środowiska
  - Sprawdzenie i instalacja zależności: Node, Java, Go, Docker.
  - Weryfikacja `docker-compose.dev.yml` i `docker-compose.yml`.
  - Wstępna konfiguracja `client/package.json` i TypeScript.
- ✅ 2. Uruchomienie lokalne
  - `docker compose --file docker-compose.dev.yml start` — kontenery uruchomione lokalnie.
  - Podstawowe sprawdzenie logów backendów (Go i Java) oraz frontendu (Vite).

## Założenia / Tech stack
- **API docs:** Swagger
- **Testowanie:** Bruno (postman/collection)
- **Autentykacja:** JSON Web Token (JWT)
- **Containerization:** Docker (obrazy i `docker-compose`)
- **Komunikacja w czasie rzeczywistym:** WebSockets
- **Logowanie:** System logów (centralny/plikowy)
- **Sesje:** Mechanizmy sesji oparte na ciasteczkach (cookie-based session)
- **Widoki serwera:** JSP / Thymeleaf (jeżeli potrzebne)
- **Testy wydajnościowe:** plan i narzędzia
- **Wzorzec architektury:** MVC
- **HTTPS:** konfiguracja z własnym certyfikatem (dev-prod)
- **Server:** Spring (Java)
- **Baza danych:** Oracle
- **Front:** React (Vite)
- **Microservices / dodatkowe serwisy:** GoLang
- **Back-End główny:** Java (Spring)

## Przewidywane funkcjonalności (funkcje biznesowe)
- **Chat**
  - Wiadomości tekstowe
  - Zdjęcia (upload/display)
  - Pliki (upload/download)
  - Przypinanie wiadomości
  - Powiadomienia real-time (WebSocket)
- **Kanban**
  - Dodawanie zadań
  - Przypisywanie zadań do użytkowników
  - Ustawianie statusów zadań
  - Terminy / daty realizacji
- **Kalendarz**
  - Tworzenie wydarzeń (parametry analogiczne do zadań Kanban)

## Priorytet zadań — sugerowana kolejność prac
1. Infra & środowisko deweloperskie (priorytet: krytyczne)
	- Uporządkować `docker-compose` (dev/prod), obrazy dla Java/Go/frontend.
	- Przygotować instrukcje uruchomienia i zmienne środowiskowe.
	- Konfiguracja HTTPS z własnym certyfikatem (dev cert) — opcjonalnie reverse proxy.
2. Autentykacja i sesje
	- Wdrożyć JWT + mechanizm odnawiania sesji (cookie/session) na backendzie Spring.
	- Zapewnić middleware/filtry bezpieczeństwa (CORS, CSRF tam gdzie potrzebne).
3. Projekt API i dokumentacja (Swagger)
	- Zdefiniować kontrakty API (REST + WebSocket messages).
	- Dodać Swagger/OpenAPI dla usług Java (i dokumentację prostych endpointów Go jeśli potrzeba).
4. Infrastruktura WebSocket
	- Zaimplementować kanały WebSocket w Spring (konfiguracja, brokery jeśli potrzebne).
	- Zapewnić broadcast/roomy/messages + testy integracyjne.
5. Core backend — baza i serwisy (Java + Oracle)
	- Model danych, repozytoria, migracje DB (skrypty/README dla Oracle).
	- Serwisy aplikacyjne (wysyłanie wiadomości, powiadomienia, zadania Kanban).
6. Integracja usług Go
	- Określić zakres Go services (jeśli będą osobne serwisy) i zapewnić komunikację (HTTP/gRPC/messages).
7. Frontend podstawowy — integracja z backendem
	- Ustawić env zmienne, klient WebSocket, podstawowe widoki: chat, kanban, kalendarz.
8. Implementacja funkcji czatu (iteracyjnie)
	- MVP: wysyłanie/odbieranie wiadomości tekstowych.
	- Rozszerzenia: upload zdjęć, plików, przypinanie, powiadomienia.
9. Implementacja Kanban
	- CRUD zadań, przypisywanie, statusy, widok listy i szczegółów.
10. Implementacja Kalendarza
	- Tworzenie wydarzeń, przypomnienia, integracja widoku kalendarza.
11. Testy (jednostkowe, integracyjne, E2E)
	- Frontend: Vitest/Jest + e2e (Playwright).
	- Backend: JUnit dla Java, testy Go.
12. Testy wydajnościowe i profilowanie
	- Scenariusze obciążeniowe (czat, listy Kanban).
13. CI/CD i wydania
	- GitHub Actions: lint, testy, build, publikacja obrazu.
14. Monitoring, logi i bezpieczeństwo
	- Centralizacja logów, alerty, przegląd zależności, skan CVE.
15. Dokumentacja i testy manualne (Bruno)
	- Uzupełnić README, dodać kolekcję Bruno/Postman do testów manualnych.

## Krótkie checklisty do odhaczenia (konkretne kroki)
- [✅] Ustawić i przetestować `docker-compose.dev.yml` z wszystkimi usługami.
- [✅] Skonfigurować certyfikat HTTPS (dev) i potwierdzić działanie.
- [ ] Implementować JWT + sesje (Spring Security).
- [ ] Zdefiniować i wdrożyć Swagger/OpenAPI dla głównych endpointów.
- [ ] Podstawić prosty kanał WebSocket i przetestować komunikację z React.
- [ ] MVP czat: wysyłanie/odbieranie tekstu + proste UI.
- [ ] Dodawanie plików/zdjęć — backend storage + frontend upload.
- [ ] MVP Kanban: CRUD zadań + przypisywanie.
- [ ] Kalendarz: tworzenie wydarzeń i integracja z Kanban.
- [ ] Napisać podstawowe testy jednostkowe i E2E.
- [ ] Dodać CI workflow (lint→test→build).

---

Plik zaktualizowany: [ProjecTea/ToDo.md](ProjecTea/ToDo.md)
