# ProjecTea

## Generowanie lokalnego certyfikatu SSL (dev)

W projekcie dostępne są skrypty do wygenerowania lokalnego keystore PKCS12 używanego przez Spring Boot w trybie deweloperskim.

Plik keystore zostanie wygenerowany w:

- `server/java/src/main/resources/keystore.p12` (hasło: `changeit`)

Skrypty:

- `server/java/scripts/generate_keystore.ps1` — PowerShell (Windows)
- `server/java/scripts/generate_keystore.sh` — bash (Linux / WSL / macOS)

Uruchomienie (PowerShell):

```powershell
cd server/java/scripts
.\generate_keystore.ps1
```

Uruchomienie (bash/WSL):

```bash
cd server/java/scripts
./generate_keystore.sh
```

Po wygenerowaniu uruchom aplikację Java i sprawdź pod `https://localhost:8082/status`. Uwaga: certyfikat jest self-signed i przeznaczony tylko do celów lokalnych — nie commituj keystore do repozytorium.
