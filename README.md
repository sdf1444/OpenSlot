# OpenSlot

OpenSlot is a personal portfolio application for managing appointment availability at a fictional community clinic. Visitors can browse appointment times, book an available slot, and cancel a booking using its confirmation code. A coordinator can publish or remove an unbooked slot.

All seeded data is synthetic. This demo is not a clinical service or medical device. It has no authentication or production privacy controls and must not be used with real patient information.

## Stack

- C# and ASP.NET Core 10 Web API
- PostgreSQL and Entity Framework Core
- React and TypeScript
- xUnit tests for appointment rules
- Docker Compose and GitHub Actions

## Run the complete app

Requires Docker Desktop or Docker Engine with Compose.

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The database is seeded with three fictional future appointment slots. Stop with `Ctrl+C`.

To reset the demo database:

```bash
docker compose down -v
```

The health endpoint is `GET /api/health`.

## Run locally without Docker

Requires the .NET 10 SDK, Node.js 22+, and PostgreSQL 16. Start PostgreSQL with the connection string in `src/AppointmentSlots.Api/appsettings.json`, then run the API and UI in separate terminals.

```bash
ASPNETCORE_URLS=http://localhost:8080 dotnet run --project src/AppointmentSlots.Api/AppointmentSlots.Api.csproj
```

```bash
cd frontend
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5173` and proxies `/api` requests to the API at `http://localhost:8080`. In PowerShell, set `$env:ASPNETCORE_URLS = 'http://localhost:8080'` before running the API command.

## Test the C# rules

```bash
dotnet test tests/AppointmentSlots.Tests/AppointmentSlots.Tests.csproj
```

The xUnit suite covers available/booked/cancelled states, future-time requirements, cancellation eligibility, and overlapping appointment intervals.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/appointments/slots?search=&date=` | Search appointment slots |
| `GET` | `/api/appointments/slots/{id}` | Read slot details and activity |
| `POST` | `/api/appointments/slots` | Publish a future appointment slot |
| `POST` | `/api/appointments/slots/{id}/bookings` | Book an available slot |
| `POST` | `/api/appointments/bookings/cancel` | Cancel with email and confirmation code |
| `PATCH` | `/api/appointments/slots/{id}/cancel` | Remove an unbooked slot |

## Design decisions

- Booking and cancellation rules live in C# domain code; the React client submits requests and displays server responses.
- A serializable database transaction protects a booking from a simultaneous request for the same slot. A revision concurrency token protects coordinator updates.
- Each slot has one current booking record. Cancelling changes that record's state and releases the slot; a later booking reuses the record with a new confirmation code.
- A provider cannot be scheduled for overlapping slots. The API validates time ranges and checks existing slots before publishing a new one.
- The activity history records slot publication, booking, cancellation, and removal without storing clinical details.

## Scope and next production steps

This demo uses `EnsureCreated` to make first run simple. A deployed service would use reviewed EF Core migrations, identity and role-based authorization, explicit patient-data protections, notification delivery, operational logging, rate limiting, backups, and a privacy-reviewed audit policy. Those are not implemented here.
