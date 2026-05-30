# CVCraft

**CVCraft** is an AI-powered CV generation and job matching platform. It helps users create professional CVs from scratch, review existing CVs, and find matching job descriptions — all in one workspace.

## Architecture

```
CVCraft
├── frontend/          # Next.js 16 + React 19 + TypeScript + Tailwind CSS
├── backend/src/       # Python FastAPI — AI services (CV gen, CV review, JD search)
├── cvcraft-backend/   # Java Spring Boot — Auth, profiles, CV library
└── gateway.py         # Unified API gateway (port 8000)
```

### Services

| Service | Stack | Port | Responsibility |
|---|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript | 3000 | UI — dashboard, CV editor, JD search |
| Python API | FastAPI, LangGraph, LangChain, ChromaDB | 8000 | AI: CV generation, CV review, JD search (RAG) |
| Java Backend | Spring Boot 3.2.5, PostgreSQL, Flyway | 8080 | Auth (JWT), user profiles, CV templates |

## Features

- **AI CV Generation** — multi-agent LangGraph pipeline generates tailored CVs using RAG over real CV examples (HuggingFace datasets + ChromaDB)
- **CV Review** — AI agents analyze an uploaded CV and return structured feedback
- **Job Description Search** — semantic search over a JD index to match roles to your profile
- **Auth & Profiles** — JWT-based registration/login, email OTP verification, password reset
- **CV Library** — browse and manage CV templates; export to PDF or DOCX

## Prerequisites

- Python 3.11+
- Node.js 18+
- Java 17 + Maven
- PostgreSQL (for the Java backend)
- An OpenAI API key

## Quick Start

### 1. Clone and configure environment

```bash
git clone https://github.com/ntuan2294/CVCraft.git
cd CVCraft
cp .env.example .env
# Edit .env — set OPENAI_API_KEY at minimum
```

For the Java backend, also copy:

```bash
cp cvcraft-backend/src/main/resources/application.yml.example \
   cvcraft-backend/src/main/resources/application.yml
# Edit application.yml — set DB_USERNAME, DB_PASSWORD, JWT_SECRET
```

### 2. Install dependencies

```bash
# Python API
pip install -e ".[api,dev]"

# Frontend
cd frontend && npm install && cd ..
```

### 3. Run all services

**Python API + Frontend (development):**

```bash
# Terminal 1 — Python API gateway
uvicorn gateway:app --reload --port 8000
# or: make api

# Terminal 2 — Frontend
cd frontend && npm run dev
# or: make frontend
```

**Java backend (optional — needed for auth/profiles):**

```bash
cd cvcraft-backend
mvn spring-boot:run
```

### 4. Access

| URL | Description |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8000/docs | Python API (Swagger UI) |
| http://localhost:8080/api/swagger-ui.html | Java API (Swagger UI) |

## Development Commands

The `Makefile` provides shortcuts for common tasks:

```bash
make install          # Install Python dependencies
make dev              # Run Python API via dev script
make api              # Run uvicorn directly
make frontend         # Run Next.js dev server
make test             # Run Python tests (pytest)
make lint             # Lint Python code (ruff)

# RAG index management
make build-hf-index   # Build CV RAG index from HuggingFace
make rag-stats        # Show CV RAG index stats
make jd-build-index   # Build JD search index
make jd-stats         # Show JD index stats
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM calls |
| `DB_USERNAME` | Java only | PostgreSQL username |
| `DB_PASSWORD` | Java only | PostgreSQL password |
| `PGDATABASE` | Java only | PostgreSQL database name (default: `cvcraft_db`) |
| `JWT_SECRET` | Java only | JWT signing secret (min 256 bits) |

See [`.env.example`](.env.example) and [`application.yml.example`](cvcraft-backend/src/main/resources/application.yml.example) for the full list.

## Testing

```bash
# Python unit tests
make test

# Frontend E2E tests (Playwright)
cd frontend
npm run test:e2e         # headless
npm run test:e2e:headed  # with browser
npm run test:e2e:ui      # Playwright UI mode
```

## Project Structure

```
backend/src/cvcraft/
├── generate_cv/    # CV generation — agents, RAG pipeline, API, CLI
├── review_cv/      # CV review — agents, API
├── jd_search/      # JD search — RAG pipeline, API, CLI
└── infrastructure/ # Shared infra (vector store, config)

frontend/src/app/
├── dashboard/      # Main dashboard
├── generate/       # CV generation flow
├── review-cv/      # CV review flow
├── jd/             # Job description search
├── cv/             # CV library
├── profile/        # User profile
└── auth/           # Login / register

cvcraft-backend/src/main/
├── java/com/cvcraft/   # Spring Boot controllers, services, repositories
└── resources/db/migration/   # Flyway SQL migrations (V1–V11)
```
