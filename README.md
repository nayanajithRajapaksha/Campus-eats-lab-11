# CampusEats

React/Vite frontend with a .NET 8 API and PostgreSQL database.

## Local setup on Windows

Prerequisites: Node.js 22.12+ (or Node.js 24), .NET 8 SDK or later with the .NET 8 runtime, and installed PostgreSQL binaries.

From this directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

Setup installs frontend and backend dependencies, creates a separate PostgreSQL cluster under `.local/postgres` on port **5433**, generates local database and JWT credentials, and applies migrations (including the eight seeded menu items). Your existing PostgreSQL service is independent of this cluster.

To choose a PostgreSQL installation, pass `-PostgresBin 'C:\Program Files\PostgreSQL\18\bin'`. On first setup, `-DatabasePort` can select a different free port. Subsequent runs reuse the existing database and settings.

Start the API and frontend in two terminals:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Target Api
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Target Frontend
```

- App: http://localhost:3000
- API / Swagger: http://localhost:5000/swagger
- Database health: http://localhost:5000/health

Use the app's registration form to create an account.

The frontend uses port 3000 because Windows reserves port 5173 on this machine.

Press Ctrl+C in each terminal to stop the app. To stop the project database:

```powershell
$database = Get-Content .local/database.json -Raw | ConvertFrom-Json
& "$($database.PostgresBin)/pg_ctl.exe" stop -D $database.DataPath -m fast
```

Local secrets are in `backend/CampusEats.Api/appsettings.Development.Local.json`; the frontend API URL is in `frontend/.env.local`. Both files, database data, logs, and package caches are ignored by Git. The API loads local settings only in Development; environment variables and command-line options take precedence.

## Checks

```powershell
dotnet build backend/CampusEats.Api/CampusEats.Api.csproj --no-restore
cd frontend
npm run build
npm run lint
```
