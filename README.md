# PetSense AI

PetSense AI is an AI-powered pet care platform for pet profiles, behavior monitoring, health and wellness tracking, medication reminders, appointment management, training guidance, progress reports, and AI-based pet-care insights.

## Tech Stack

- Backend: .NET 9 Web API, Clean Architecture, EF Core, PostgreSQL, MediatR, FluentValidation, JWT auth, Swagger/OpenAPI, Serilog
- Frontend: Angular 22, Angular Material, Tailwind CSS
- Database: PostgreSQL
- Containers: Docker and Docker Compose

## Project Structure

- `src/backend/PetSenseAI.Domain` - domain entities and audit/soft-delete base types
- `src/backend/PetSenseAI.Application` - auth and AI CQRS contracts, validation, repository abstractions
- `src/backend/PetSenseAI.Infrastructure` - EF Core DbContext, repositories, seed data, JWT/password services, mock AI service
- `src/backend/PetSenseAI.API` - controllers, Swagger, auth, middleware, static uploads
- `src/frontend` - Angular public website, user portal, and admin dashboard

## Prerequisites

- .NET 9 SDK
- Node.js 24+
- Docker Desktop, optional but recommended
- PostgreSQL, only needed when not using Docker

## Run Everything Locally

From the project root:

```powershell
npm run dev
```

This starts the API on `http://localhost:5000` with the local SQLite dev database and starts the Angular app on `http://localhost:4200`. If either service is already running, the script reuses it.

## Run With Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- Frontend: `http://localhost:4200`
- API Swagger: `http://localhost:5000/swagger`

The API applies the initial EF migration and seeds content on startup.

## Run Backend Locally

```powershell
dotnet restore .\PetSenseAI.sln
dotnet build .\PetSenseAI.sln
dotnet run --project .\src\backend\PetSenseAI.API\PetSenseAI.API.csproj
```

Default connection string is in `src/backend/PetSenseAI.API/appsettings.json`.

## Run Frontend Locally

```powershell
cd .\src\frontend
npm install
npm start
```

The Angular app expects the API at `http://localhost:5000/api`.

## Deploy Frontend To Vercel

The repository includes `vercel.json` so Vercel can deploy the Angular frontend from the repo root.

- Framework preset: Other
- Install command: `npm --prefix src/frontend ci`
- Build command: `node tools/write-vercel-env.mjs && npm --prefix src/frontend run build`
- Output directory: `src/frontend/dist/petsense-ai-web/browser`

Set `PETSENSE_API_URL` in Vercel to the public URL of the hosted .NET API, for example `https://api.yourdomain.com/api`. If it is not set, the frontend uses `/api`.

If the Vercel project root directory is set to `src/frontend`, use the frontend-local config:

- Install command: `npm ci`
- Build command: `node tools/write-env.mjs && npm run build`
- Output directory: `dist/petsense-ai-web/browser`

## Migrations

The project includes an initial EF Core migration:

```powershell
dotnet ef database update --project .\src\backend\PetSenseAI.Infrastructure --startup-project .\src\backend\PetSenseAI.API
```

Create future migrations with:

```powershell
dotnet ef migrations add MigrationName --project .\src\backend\PetSenseAI.Infrastructure --startup-project .\src\backend\PetSenseAI.API
```

## Default Logins

- Admin: `admin@petsense.ai` / `Admin123!`
- Sample owner: `owner@petsense.ai` / `Owner123!`

## Environment Variables

- `ConnectionStrings__DefaultConnection`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Jwt__SigningKey`
- `Jwt__AccessTokenMinutes`
- `Jwt__RefreshTokenDays`
- `Cors__Origins__0`

## AI Service

`IAiInsightService` is implemented with a mock rule engine so the application works without paid API keys. The connection point for OpenAI or Azure OpenAI is documented inside `AiInsightService`.

## Admin Capabilities

The admin dashboard manages hero content, problem statements, solution points, features, How It Works steps, Why Now content, target customers, comparison rows, testimonials, uploaded media, waitlist submissions, users, training guides, and recommendation templates. Public website content is loaded from the API and updates automatically after admin changes.
