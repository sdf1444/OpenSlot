# OpenSlot

OpenSlot is a personal portfolio application for managing appointment availability at a fictional community clinic. Signed-in users can browse appointment times, book an available slot, and cancel a booking using its confirmation code. A coordinator can publish or remove an unbooked slot.

All seeded data is synthetic. This demo is not a clinical service or medical device and must not be used with real patient information. Coordinator access uses one account configured through environment variables; it is not a multi-user identity system. The coordinator sign-in screen is available at `/login`.

## Stack

- C# and ASP.NET Core 10 Web API
- PostgreSQL and Entity Framework Core
- React and TypeScript
- xUnit tests for appointment rules
- Docker Compose and GitHub Actions

## Run the complete app

Requires Docker Desktop or Docker Engine with Compose.

Create a local `.env` file and set unique passwords for the demo database and coordinator account:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace both placeholders with unique, strong passwords. The coordinator password must be at least 16 characters. The `.env` file is ignored by Git.

```powershell
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The database is seeded with three fictional future appointment slots. Stop with `Ctrl+C`.

To reset the demo database:

```bash
docker compose down -v
```

The health endpoint is `GET /api/health`.

## Run locally without Docker

Requires the .NET 10 SDK, Node.js 22+, and PostgreSQL 16. Set `ConnectionStrings__Appointments` to a connection string for your local PostgreSQL instance, then run the API and UI in separate terminals.

```powershell
$env:ConnectionStrings__Appointments = 'Host=localhost;Port=5432;Database=appointments;Username=appointments;Password=your-local-password'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Coordinator__Username = 'coordinator'
$env:Coordinator__Password = 'your-unique-password-at-least-16-characters'
$env:ASPNETCORE_URLS = 'http://localhost:8080'
dotnet run --project src/AppointmentSlots.Api/AppointmentSlots.Api.csproj
```

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5173` and proxies `/api` requests to the API at `http://localhost:8080`.

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
| `GET` | `/api/auth/session` | Get sign-in status and a CSRF request token |
| `POST` | `/api/auth/login` | Sign in as coordinator |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/appointments/slots` | Publish a future appointment slot (coordinator only) |
| `POST` | `/api/appointments/slots/{id}/bookings` | Book an available slot |
| `POST` | `/api/appointments/bookings/cancel` | Cancel with email and confirmation code |
| `PATCH` | `/api/appointments/slots/{id}/cancel` | Remove an unbooked slot (coordinator only) |

Before any `POST` or `PATCH` request, call `/api/auth/session`, retain its cookies, and send the returned `requestToken` in the `X-CSRF-TOKEN` header. Production cookies are secure and require HTTPS.

## Design decisions

- Booking and cancellation rules live in C# domain code; the React client submits requests and displays server responses.
- A serializable database transaction protects a booking from a simultaneous request for the same slot. A revision concurrency token protects coordinator updates.
- Each slot has one current booking record. Cancelling changes that record's state and releases the slot; a later booking reuses the record with a new confirmation code.
- A provider cannot be scheduled for overlapping slots. The API validates time ranges and checks existing slots before publishing a new one.
- The activity history records slot publication, booking, cancellation, and removal without storing clinical details.
- Coordinator login uses an HTTP-only, secure, same-site cookie; unsafe API requests require an antiforgery token.
- The web interface requires the configured coordinator account. Browsing and booking API routes remain public; publishing and removing slots require authentication.

## Scope and next production steps

This demo uses `EnsureCreated` to make first run simple. A deployed service would use reviewed EF Core migrations, managed identities and role-based authorization, explicit patient-data protections, notification delivery, operational logging, backups, and a privacy-reviewed audit policy. Those are not implemented here.
