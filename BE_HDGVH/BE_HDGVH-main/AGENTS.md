# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

BE_API (BE_HDGVH) is an ASP.NET Core 9 / .NET 9 backend REST API for an e-commerce / sales-and-inventory management system. The codebase is authored in Vietnamese. See `docker-compose.yml` comments and `.env.example` for configuration reference.

### Required services

| Service | How to start | Port |
|---------|-------------|------|
| SQL Server 2022 | `sudo docker compose up -d sqlserver` | 1434 (maps to 1433 inside container) |
| BE_API | `sudo docker compose up --build -d api` | 8080 |

Both services: `sudo docker compose up --build -d`

### Development commands

- **Build**: `dotnet build`
- **Run via Docker (recommended)**: `sudo docker compose up --build -d` — starts SQL Server + API. Swagger UI at `http://localhost:8080/swagger`
- **Run locally (without Docker for the API)**: Requires a SQL Server instance on `localhost:1433`. Then `dotnet run` in the repo root.
- **Lint**: `dotnet build` (no separate linter configured; zero-warning builds are the check)
- **Tests**: No automated test project exists in this repo.

### Caveats

- Docker daemon must be running (`sudo dockerd &` if not started). The VM uses `fuse-overlayfs` storage driver and `iptables-legacy`.
- The app auto-runs EF Core migrations and seeds a default admin user (`admin` / `123456`) on first start when the `AppUsers` table is empty.
- External services (payOS, Cloudinary, SMTP) are optional. The app starts without their credentials; only their specific endpoints will fail.
- The `.env` file is read by both Docker Compose (variable substitution) and the app directly via `DotEnvLoader` when running with `dotnet run`.
- `sudo` is needed for `docker` commands unless the user is in the `docker` group.
