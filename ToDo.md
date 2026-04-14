# ToDo — ProjecTea

---

## ✅ 1. Przygotowanie środowiska
1.1. Sprawdzić i zainstalować zależności lokalne (Node, Java, Go, Docker).
1.2. Zweryfikować pliki konfiguracyjne: `docker-compose.dev.yml`, `docker-compose.yml`.
1.3. Upewnić się, że pliki `client/package.json` i konfiguracje TS są poprawne.

## ✅ 2. Uruchomienie lokalne 
2.1. Uruchomić: `docker compose --file docker-compose.dev.yml start` i potwierdzić działanie kontenerów.
2.2. Sprawdzić logi backendów (Go i Java) oraz frontend (Vite).
2.3. Naprawić błędy uruchomienia (porty, zmienne środowiskowe).

## 3. Frontend — funkcjonalności czatu 
3.1. Przejrzeć komponenty: `src/Components/chat`, `chatWindow`, `messageSender`.
3.2. Uzupełnić brakujące elementy UI i obsługę stanów (loading, error, empty).
3.3. Dodać obsługę wysyłania/odbierania wiadomości (WebSocket/REST klient).

## 4. Frontend — jakość kodu i budowanie 
4.1. Uruchomić ESLint i poprawić ostrzeżenia (`client/eslint.config.js`).
4.2. Sprawdzić TypeScript i zbudować aplikację (`npm run build` / `vite build`).
4.3. Dodać skrypty przydatne w `package.json` (start, dev, build, lint, test).

## 5. Backend Go — API i logika 
5.1. Przejrzeć `server/go/src` (jeśli istnieje) i zabezpieczyć endpointy.
5.2. Dodać/wykonać obsługę WebSocketów lub REST zgodnie z wymaganiami czatu.
5.3. Napisać podstawowe testy jednostkowe handlerów.

## 6. Backend Java — konfiguracja i integracja 
6.1. Sprawdzić `server/java` — `pom.xml`, `application.properties` i serwisy.
6.2. Upewnić się, że aplikacja buduje się (`mvnw package`) i działa w kontenerze.
6.3. Zaimplementować brakujące API wymagane przez frontend.

## 7. Integracja frontend-backend 
7.1. Skonfigurować adresy API / WebSocketów (zmienne środowiskowe).
7.2. Przetestować przepływ: wysyłanie wiadomości → backend → broadcasting → frontend.
7.3. Naprawić problemy z CORS, autentykacją lub formatem danych.

## 8. Testy 
8.1. Dodać testy jednostkowe frontend (`Jest`/`Vitest`) i backend (Go/JUnit dla Java).
8.2. Napisać prosty test E2E (np. Playwright) symulujący wysyłanie wiadomości.

## 9. CI/CD 
9.1. Dodać workflow CI (GitHub Actions / inny): instalacja, lint, testy, build.
9.2. Dodać zadanie build/deploy dla obrazu Dockera (opcjonalnie push do rejestru).

## 10. Dokumentacja 
10.1. Uaktualnić `README.md` główny z instrukcjami uruchomienia i architekturą.
10.2. Uzupełnić `server/java/HELP.md` jeśli jest potrzebne.
10.3. Dodać krótkie HOWTO dev: uruchamianie, debug, testy.

## 11. Optymalizacja i bezpieczeństwo 
11.1. Przegląd zależności i aktualizacje (npm, Maven). Weryfikacja CVE.
11.2. Profilowanie wydajności i poprawa bottlenecków.

## 12. Release i deployment 
12.1. Przygotować wersjonowanie (tagi, changelog).
12.2. Przygotować instrukcje deploymentu (prod compose / Helm / IaC).
