# Hướng dẫn cài đặt và chạy CVCraft

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Cài đặt lần đầu](#3-cài-đặt-lần-đầu)
4. [Cấu hình biến môi trường](#4-cấu-hình-biến-môi-trường)
5. [Chạy dự án](#5-chạy-dự-án)
6. [Các URL quan trọng](#6-các-url-quan-trọng)
7. [API Reference](#7-api-reference)
8. [Tính năng nâng cao](#8-tính-năng-nâng-cao)
9. [Lệnh thường dùng](#9-lệnh-thường-dùng)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|---------------------|----------|
| Python  | 3.11+               | `python --version` |
| Node.js | 18+                 | `node --version` |
| npm     | 9+                  | `npm --version` |
| Java    | 21+                 | `java --version` |
| Maven   | 3.9+                | `mvn --version` |
| PostgreSQL | 15+             | `psql --version` |
| Git     | Bất kỳ              | `git --version` |

> **Redis** là tuỳ chọn — app chạy bình thường không có Redis (dùng in-memory cache).  
> **Java backend** là tuỳ chọn nếu chỉ muốn test AI generation (không cần Auth/Profile/CV Library).

---

## 2. Cấu trúc dự án

```
CVCraft/
├── backend/                    ← Python AI services (FastAPI, port 8000)
│   ├── src/cvcraft/
│   │   ├── config/             ← Settings (API key, paths, Redis, rate limits)
│   │   ├── infrastructure/
│   │   │   ├── cache/          ← Redis cache (với in-memory fallback)
│   │   │   ├── llm/            ← LLM factory (OpenAI / Claude)
│   │   │   └── rate_limit/     ← Rate limiting (slowapi)
│   │   ├── generate_cv/        ← Pipeline tạo CV (LangGraph 6-agent)
│   │   │   ├── agents/         ← jd_analyzer, summary, experience, skills, qc, renderer
│   │   │   ├── pipeline/       ← Orchestration graph
│   │   │   ├── rag/            ← Vector store + CV examples
│   │   │   ├── services/       ← CVService, RAGService, CVTaskService
│   │   │   └── api/v1/cv.py    ← REST endpoints /v1/cv/*
│   │   └── jd_search/          ← Tìm kiếm JD semantic
│   │       ├── rag/            ← ChromaDB + loaders
│   │       ├── services/       ← JDSearchService (Redis cache)
│   │       └── api/v1/jd.py    ← REST endpoints /v1/jd/*
│   ├── data/vectordb/          ← ChromaDB local (tự động tạo, không commit)
│   ├── outputs/                ← CV đã tạo (.docx) (không commit)
│   └── templates/              ← 5 mẫu CV (.docx)
├── cvcraft-backend/            ← Java Spring Boot (port 8080)
│   └── src/main/java/com/cvcraft/
│       ├── controller/         ← AuthController, CandidateController, CvDocumentController
│       ├── entity/             ← User, CandidateProfile, CvDocument
│       └── resources/db/migration/ ← Flyway SQL migrations
├── frontend/                   ← Next.js 16 (port 3000)
│   └── src/
│       ├── app/                ← Pages
│       ├── components/         ← Navbar, Footer, ...
│       ├── features/           ← generate-cv feature module
│       └── lib/                ← API clients, types, i18n
├── docs/                       ← Tài liệu dự án
├── gateway.py                  ← FastAPI entry point
├── pyproject.toml              ← Python dependencies
├── Makefile                    ← Lệnh tắt
└── .env                        ← Biến môi trường (không commit)
```

---

## 3. Cài đặt lần đầu

> Chỉ cần thực hiện **một lần duy nhất**.

### Bước 1 — Clone và vào thư mục dự án

```powershell
git clone <repo-url> CVCraft
cd CVCraft
```

### Bước 2 — Tạo Python virtual environment

```powershell
python -m venv .venv
```

Kích hoạt:

```powershell
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# macOS / Linux
source .venv/bin/activate
```

Sau khi kích hoạt, prompt có dạng `(.venv) PS C:\...>`.

### Bước 3 — Cài Python packages

```powershell
pip install -e ".[api,dev]"
```

### Bước 4 — Cài Frontend packages

```powershell
cd frontend
npm install
cd ..
```

### Bước 5 — Cài đặt Java Backend

```powershell
# Tạo PostgreSQL database
psql -U postgres -c "CREATE DATABASE cvcraft_db;"

# Build Java backend
cd cvcraft-backend
mvn clean install -DskipTests
cd ..
```

### Bước 6 — Tạo file `.env`

```powershell
copy .env.example .env
```

Mở `.env` và điền API key (xem [Mục 4](#4-cấu-hình-biến-môi-trường)).

---

## 4. Cấu hình biến môi trường

### File `.env` — Python AI + Frontend

```env
# Bắt buộc
OPENAI_API_KEY=sk-...

# Tuỳ chọn
REDIS_URL=redis://localhost:6379/0
GENERATE_CV_URL=http://localhost:8000
PUBLIC_API_URL=http://localhost:8000
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
```

### File `cvcraft-backend/src/main/resources/application.yml` — Java Backend

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/cvcraft_db
    username: postgres
    password: your_password

jwt:
  secret: your_secret_key_at_least_32_characters_long
  expiration: 3600000
  refresh-expiration: 86400000
```

Hoặc dùng biến môi trường:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/cvcraft_db"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "your_password"
$env:JWT_SECRET = "your_secret_key_at_least_32_characters"
```

### Bảng tóm tắt

| Biến | Bắt buộc | Mô tả | Mặc định |
|------|----------|-------|----------|
| `OPENAI_API_KEY` | ✅ | API key OpenAI | — |
| `REDIS_URL` | ❌ | URL Redis server | `redis://localhost:6379/0` |
| `GENERATE_CV_URL` | ❌ | URL Python AI cho FE | `http://localhost:8000` |
| `PUBLIC_API_URL` | ❌ | URL backend công khai (OnlyOffice) | `http://localhost:8000` |
| `ONLYOFFICE_DOCUMENT_SERVER_URL` | ❌ | URL OnlyOffice server | (tắt) |

---

## 5. Chạy dự án

### Service nào cần thiết?

| Muốn làm gì | Service cần chạy |
|-------------|-----------------|
| Tạo CV bằng AI | Python (8000) + Frontend (3000) |
| Lưu CV, quản lý thư viện | + Java Backend (8080) + PostgreSQL |
| Đầy đủ tính năng | Tất cả 3 service |

---

### Cách 1 — Chạy Python AI + Frontend (khuyên dùng khi dev AI)

```powershell
.venv\Scripts\Activate.ps1
python scripts/dev.py
```

Khi thấy:

```
[dev] Frontend: http://localhost:3000
[dev] Backend:  http://localhost:8000/docs
[dev] Press Ctrl+C to stop all services.
```

→ Mở http://localhost:3000

---

### Cách 2 — Chạy đầy đủ 3 service (mở 3 terminal)

**Terminal 1 — Python AI Backend:**

```powershell
.venv\Scripts\Activate.ps1
uvicorn gateway:app --reload --port 8000
```

**Terminal 2 — Java Backend:**

```powershell
cd cvcraft-backend
mvn spring-boot:run
```

**Terminal 3 — Frontend:**

```powershell
cd frontend
npm run dev
```

---

### Cách 3 — Chạy riêng từng service

```powershell
# Python AI (port 8000)
.venv\Scripts\Activate.ps1
uvicorn gateway:app --reload --port 8000

# Frontend (port 3000)
cd frontend && npm run dev

# Java (port 8080)
cd cvcraft-backend && mvn spring-boot:run
```

---

### Đổi port

```powershell
python scripts/dev.py --backend-port 8010 --frontend-port 3001
```

---

## 6. Các URL quan trọng

| Service | URL | Mô tả |
|---------|-----|-------|
| **Giao diện chính** | http://localhost:3000 | Web app |
| **Tạo CV** | http://localhost:3000/cv/generate | Form tạo CV bằng AI |
| **Tìm JD** | http://localhost:3000/jd/search | Tìm JD semantic |
| **Thư viện CV** | http://localhost:3000/dashboard | CV đã lưu của tôi |
| **Python Swagger** | http://localhost:8000/docs | API docs AI |
| **Java Swagger** | http://localhost:8080/api/swagger-ui.html | API docs Java |
| **Health check** | http://localhost:8000/health | Trạng thái Python server |
| **Cache stats** | http://localhost:8000/v1/cv/cache/stats | Thống kê Redis |

---

## 7. API Reference

### CV Generation (Python, port 8000)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/v1/cv/generate` | Tạo CV **đồng bộ** (~30-60s) |
| `POST` | `/v1/cv/generate/async` | Tạo CV **bất đồng bộ** — trả `task_id` ngay |
| `GET`  | `/v1/cv/tasks/{task_id}` | Poll trạng thái task async |
| `GET`  | `/v1/cv/history` | Lịch sử 20 CV gần nhất |
| `DELETE` | `/v1/cv/history` | Xoá lịch sử |
| `GET`  | `/v1/cv/download?path=...` | Tải file `.docx` |

### JD Search (Python, port 8000)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/v1/jd/search` | Tìm kiếm JD theo semantic |
| `POST` | `/v1/jd/index` | Index JD mới vào vector store |
| `GET`  | `/v1/jd/stats` | Thống kê JD collection |

### Auth (Java, port 8080/api)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/auth/register` | Đăng ký tài khoản |
| `POST` | `/auth/login` | Đăng nhập, lấy JWT |
| `POST` | `/auth/refresh` | Làm mới access token |

### Profile (Java, port 8080/api)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/profile` | Xem profile CV của mình |
| `PUT`  | `/profile` | Cập nhật profile |

### CV Library (Java, port 8080/api)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/cv-docs` | Danh sách CV đã lưu |
| `POST` | `/cv-docs` | Lưu CV mới |
| `PATCH`| `/cv-docs/{id}/primary` | Đặt làm CV chính |
| `DELETE`| `/cv-docs/{id}` | Xóa CV |

### Luồng async (khuyên dùng cho production)

```
Client                          Backend
  │                                │
  │  POST /v1/cv/generate/async    │
  │ ─────────────────────────────► │
  │  ◄─ 202 { task_id: "abc..." }  │  ← trả ngay, không block
  │                                │
  │  GET /v1/cv/tasks/abc...       │
  │ ─────────────────────────────► │
  │  ◄─ { status: "processing" }   │  ← poll mỗi 3-5s
  │                                │
  │  GET /v1/cv/tasks/abc...       │
  │ ─────────────────────────────► │
  │  ◄─ { status: "done",          │  ← kết quả đầy đủ
  │       result: { ... } }        │
```

---

## 8. Tính năng nâng cao

### Redis Cache

Redis tăng tốc bằng cách cache:
- Kết quả tìm kiếm JD (TTL 1 giờ)
- JD sections đã format bởi LLM (TTL 24 giờ)
- CV task state (TTL 24 giờ)

**Cài Redis (Docker):**

```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

Thêm vào `.env`:

```env
REDIS_URL=redis://localhost:6379/0
```

Kiểm tra: http://localhost:8000/health

---

### OnlyOffice — Chỉnh sửa CV giống Word trên trình duyệt

```powershell
docker run -d --name onlyoffice -p 80:80 --restart=always onlyoffice/documentserver
```

Thêm vào `.env`:

```env
PUBLIC_API_URL=http://host.docker.internal:8000
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:80
```

> `PUBLIC_API_URL` phải là URL OnlyOffice container có thể truy cập được.  
> Windows/Mac: dùng `host.docker.internal`. Linux: dùng IP thực của máy.

---

### Build RAG Index

RAG giúp AI tạo CV chất lượng hơn bằng cách học từ ví dụ:

```powershell
# Build CV RAG từ seed samples (~5 giây)
make build-index

# Build JD search index
make jd-build-seed-index

# Build từ HuggingFace dataset (cần internet)
curl -X POST http://localhost:8000/v1/cv/rag/build \
  -H "Content-Type: application/json" \
  -d '{"source": "hf", "max_records": 500}'
```

---

## 9. Lệnh thường dùng

```powershell
# Chạy
make dev                  # Python AI + Frontend cùng lúc
make api                  # Python AI riêng
make frontend             # Frontend riêng

# Java backend
cd cvcraft-backend && mvn spring-boot:run

# RAG
make build-index          # Build CV RAG index (seed)
make jd-build-seed-index  # Build JD index (seed)
make rag-stats            # Xem thống kê RAG
make jd-stats             # Xem thống kê JD index

# Dev
make test                 # Chạy test suite
make lint                 # Kiểm tra code style (ruff)
make install              # Cài Python packages
make frontend-install     # Cài npm packages
```

---

## 10. Xử lý lỗi thường gặp

### Lỗi Python

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `ModuleNotFoundError: No module named 'cvcraft'` | Chưa activate venv hoặc chưa install | Activate venv rồi `pip install -e ".[api,dev]"` |
| `AuthenticationError` / `Incorrect API key` | Sai OPENAI_API_KEY | Kiểm tra file `.env` |
| `Address already in use` | Port đang bị chiếm | `python scripts/dev.py --backend-port 8010` |

### Lỗi Frontend

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `Cannot find module 'next'` | Chưa cài npm packages | `cd frontend && npm install` |
| `Error: Cannot find module` | npm install chưa xong | Chạy lại `npm install` |

### Lỗi Java Backend

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `Connection refused` (PostgreSQL) | PostgreSQL chưa chạy | Khởi động PostgreSQL service |
| `Database does not exist` | Chưa tạo database | `psql -c "CREATE DATABASE cvcraft_db;"` |
| `Flyway migration failed` | Migration lỗi | Xem log, check DB schema |
| Port 8080 bị chiếm | Process khác | Đổi port trong application.yml |

### Lỗi quyền PowerShell

```
.venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled
```

**Sửa:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Reset dữ liệu RAG

```powershell
Remove-Item -Recurse -Force backend\data\vectordb
make build-index
make jd-build-seed-index
```

---

## Lưu ý bảo mật

- File `.env` chứa API key — **không bao giờ commit lên Git**
- `.env.example` là template an toàn để commit
- Rate limiting: 10 req/phút/IP cho CV generation, 30 req/phút/IP cho JD search
- JWT secret phải dài ít nhất 32 ký tự
