# CVCraft

CVCraft là công cụ **tạo và quản lý CV bằng AI** — không phải nền tảng tìm kiếm việc làm.

Người dùng nhập thông tin cá nhân + mô tả công việc (JD), hệ thống AI đa tác tử phân tích JD và tạo ra CV được cá nhân hóa, tối ưu ATS, xuất ra file `.docx`.

## Cấu trúc dự án

```
CVCraft/
├── backend/                   # Python AI services (FastAPI)
│   ├── src/cvcraft/
│   │   ├── config/            # Settings (API key, paths, Redis)
│   │   ├── infrastructure/    # LLM factory, Redis cache, rate limit
│   │   ├── generate_cv/       # Pipeline tạo CV (LangGraph 6-agent)
│   │   │   ├── agents/        # jd_analyzer, summary, experience, skills, qc, template_renderer
│   │   │   ├── pipeline/      # LangGraph orchestration
│   │   │   ├── rag/           # Vector store + CV examples (ChromaDB)
│   │   │   ├── services/      # CVService, RAGService, CVTaskService
│   │   │   └── api/v1/cv.py   # REST endpoints /v1/cv/*
│   │   └── jd_search/         # Tìm kiếm JD semantic
│   │       ├── rag/           # ChromaDB + HuggingFace loader
│   │       ├── services/      # Semantic search + AI formatting
│   │       └── api/v1/jd.py   # REST endpoints /v1/jd/*
│   ├── data/vectordb/         # ChromaDB local storage (tự tạo, không commit)
│   ├── outputs/               # CV đã tạo (.docx) (không commit)
│   └── templates/             # 5 mẫu CV (.docx)
├── cvcraft-backend/           # Java Spring Boot (Auth + Profile + CV Library)
│   └── src/main/java/com/cvcraft/
│       ├── controller/        # AuthController, CandidateController (/profile), CvDocumentController
│       ├── entity/            # User, CandidateProfile, CvDocument
│       └── ...
├── frontend/                  # Next.js 16 UI
│   └── src/
│       ├── app/               # Pages: cv/generate, jd/search, dashboard, auth
│       ├── components/        # Navbar, Footer, DocxOutputEditor, ...
│       ├── features/          # generate-cv feature module
│       └── lib/               # API clients, types, i18n (VI/EN)
├── docs/                      # Tài liệu dự án
├── gateway.py                 # FastAPI entry point (mount 2 router vào 1 port)
├── scripts/dev.py             # Khởi động Python backend + frontend cùng lúc
├── pyproject.toml             # Python dependencies
└── .env                       # API keys (không commit)
```

## Stack công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Java Backend | Spring Boot 3.2, Spring Security/JWT, JPA/PostgreSQL, Flyway |
| Python AI | FastAPI, LangGraph (multi-agent), ChromaDB, Redis |
| LLM | OpenAI GPT-4o (hoặc Anthropic Claude) |
| Document | python-docx, OnlyOffice (tuỳ chọn) |

## Cài đặt nhanh

```bash
# 1. Python virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1       # Windows
# source .venv/bin/activate      # macOS/Linux

pip install -e ".[api,dev]"

# 2. Frontend
cd frontend && npm install && cd ..

# 3. Java backend (cần PostgreSQL đang chạy)
# Tạo DB trước: CREATE DATABASE cvcraft_db;
# Xem cvcraft-backend/README.md để cấu hình

# 4. Biến môi trường
copy .env.example .env
# Điền OPENAI_API_KEY vào .env
```

## Chạy dự án

```bash
# Python AI + Frontend (port 8000 + 3000)
python scripts/dev.py

# Java Backend riêng (port 8080) — cần PostgreSQL
cd cvcraft-backend && mvn spring-boot:run
```

Hoặc chạy riêng từng service:

```bash
# Python AI backend (port 8000)
uvicorn gateway:app --reload --port 8000

# Frontend (port 3000)
cd frontend && npm run dev
```

## Các URL quan trọng

| URL | Mô tả |
|-----|-------|
| http://localhost:3000 | Giao diện chính |
| http://localhost:3000/cv/generate | **Tạo CV bằng AI** (tính năng chính) |
| http://localhost:3000/jd/search | Tìm kiếm JD semantic |
| http://localhost:3000/dashboard | Thư viện CV của tôi |
| http://localhost:8000/docs | Swagger UI — Python AI API |
| http://localhost:8080/api/swagger-ui.html | Swagger UI — Java API |
| http://localhost:8000/health | Health check |

## API tóm tắt

### Python AI (port 8000)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/v1/cv/generate` | Tạo CV đồng bộ (~30-60s) |
| `POST` | `/v1/cv/generate/async` | Tạo CV bất đồng bộ — trả `task_id` |
| `GET`  | `/v1/cv/tasks/{task_id}` | Poll trạng thái task |
| `GET`  | `/v1/cv/download` | Tải file `.docx` |
| `POST` | `/v1/jd/search` | Tìm JD theo semantic search |
| `GET`  | `/v1/cv/rag/stats` | Thống kê RAG vector store |

### Java (port 8080/api)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/auth/login` | Public | Đăng nhập, lấy JWT |
| `GET`  | `/profile` | JWT | Xem profile CV của mình |
| `PUT`  | `/profile` | JWT | Cập nhật profile |
| `GET`  | `/cv-docs` | JWT | Danh sách CV đã lưu |
| `POST` | `/cv-docs` | JWT | Lưu CV vào thư viện |
| `PATCH`| `/cv-docs/{id}/primary` | JWT | Đặt làm CV chính |
| `DELETE`| `/cv-docs/{id}` | JWT | Xóa CV khỏi thư viện |

## Luồng xử lý AI

```
Người dùng nhập: thông tin cá nhân + JD
         │
         ▼
   POST /api/cv/generate (Next.js proxy)
         │
         ▼
   Python FastAPI → LangGraph Pipeline
         │
   ┌─────┴──────────────────────────────┐
   │  jd_analyzer → phân tích JD        │
   │  user_profile → chuẩn hóa input    │
   │  summary_agent → viết summary      │ ← RAG (ví dụ CV tốt)
   │  experience_agent → viết bullets   │
   │  skills_agent → phân nhóm kỹ năng  │
   │  qc_agent → chấm điểm ATS          │
   │  template_renderer → xuất .docx    │
   └────────────────────────────────────┘
         │
         ▼
   CV file (.docx) + Quality Score
         │
         ▼
   Người dùng download / lưu vào thư viện
```

## Tài liệu chi tiết

- [Hướng dẫn cài đặt & chạy dự án](docs/GUIDE_VI.md)
- [Luồng AI](docs/ai-flow.md)
- [Hướng dẫn test](docs/TESTING.md)
- [Java Backend API](cvcraft-backend/README.md)
