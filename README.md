# CVCraft

CVCraft là hệ thống tạo CV bằng AI, gồm frontend Next.js và backend FastAPI với pipeline multi-agent (LangGraph) và RAG search cho Job Description.

## Cấu trúc dự án

```
CVCraft/
├── backend/                   # Toàn bộ Python backend
│   ├── src/cvcraft/
│   │   ├── config/            # Settings (OpenAI key, paths)
│   │   ├── infrastructure/    # LLM factory dùng chung
│   │   ├── generate_cv/       # Luồng tạo CV
│   │   │   ├── agents/        # AI agents (jd_analyzer, summary, experience, skills, qc, template_renderer)
│   │   │   ├── pipeline/      # LangGraph orchestration
│   │   │   ├── rag/           # Vector store + RAG examples
│   │   │   ├── services/      # Use-case layer
│   │   │   └── api/           # FastAPI router /v1/cv
│   │   └── jd_search/         # Luồng tìm kiếm JD
│   │       ├── rag/           # ChromaDB + HuggingFace loader
│   │       ├── services/      # Semantic search + AI formatting
│   │       └── api/           # FastAPI router /v1/jd
│   ├── data/vectordb/         # ChromaDB local storage
│   └── outputs/               # CV đã tạo (.docx)
├── frontend/                  # Next.js UI + API proxy routes
├── gateway.py                 # FastAPI entry point — mount cả 2 router vào 1 port
├── pyproject.toml
├── scripts/dev.py             # Khởi động backend + frontend cùng lúc
└── .env                       # OPENAI_API_KEY
```

## Cài đặt

```bash
# 1. Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -e ".[api,dev]"

# 2. Frontend
cd frontend
npm install
cd ..

# 3. Tạo .env
echo OPENAI_API_KEY=sk-... > .env
```

## Chạy dự án

```bash
# Chạy backend + frontend cùng lúc (khuyên dùng)
python scripts/dev.py
```

Hoặc chạy riêng từng service:

```bash
# Backend (port 8000)
uvicorn gateway:app --reload --port 8000

# Frontend (port 3000)
cd frontend && npm run dev
```

## API

Cả Generate CV và JD Search chạy trên cùng 1 port:

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/v1/cv/generate` | Tạo CV từ JD + thông tin user |
| `GET` | `/v1/cv/download` | Tải file CV (.docx) |
| `GET` | `/v1/cv/rag/stats` | Thống kê RAG vector store |
| `POST` | `/v1/jd/search` | Tìm kiếm JD theo semantic search |
| `POST` | `/v1/jd/index` | Index JD mới vào vector store |
| `GET` | `/v1/jd/stats` | Thống kê JD collection |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |

## Luồng xử lý AI

```
User
 │
 ▼
Frontend (Next.js)
 │
 ├─► /api/jd/search ──► jd_search service
 │                          ├─ Embed query (OpenAI)
 │                          ├─ Query ChromaDB
 │                          └─ Format JD sections (LLM)
 │
 └─► /api/cv/generate ──► generate_cv pipeline (LangGraph)
                              ├─ jd_analyzer
                              ├─ user_profile
                              ├─ summary_agent      ◄─ RAG
                              ├─ experience_agent   ◄─ RAG
                              ├─ skills_agent
                              ├─ qc_agent
                              └─ template_renderer
```

Frontend không gọi FastAPI trực tiếp từ browser — mọi request đi qua Next.js API routes để gom cấu hình endpoint.

## Cấu hình

| Biến | Mô tả | Mặc định |
|---|---|---|
| `OPENAI_API_KEY` | API key OpenAI (bắt buộc) | — |
| `GENERATE_CV_URL` | URL backend cho FE | `http://localhost:8000` |
| `JD_SEARCH_URL` | URL backend cho FE | `http://localhost:8000` |

## Lệnh thường dùng

```bash
make dev                  # Chạy toàn bộ app
make build-index          # Build RAG index từ seed samples
make jd-build-seed-index  # Build JD index từ seed samples
make test                 # Chạy test
make lint                 # Kiểm tra code style
```

## Tài liệu

- [Hướng dẫn cài đặt & chạy dự án](docs/GUIDE_VI.md)
- [AI flow](docs/ai-flow.md)
- [Testing](docs/TESTING.md)