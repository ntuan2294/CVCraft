# CVCraft

CVCraft là hệ thống tạo CV bằng AI, gồm frontend Next.js, backend FastAPI, RAG search cho Job Description và pipeline multi-agent để sinh nội dung CV.

## Cấu Trúc Chính

```text
CVCraft/
├── frontend/              # FE - Next.js UI và API proxy routes
├── generate-cv/           # BE - FastAPI service sinh CV bằng LangGraph agents
├── jd-search/             # BE - FastAPI service tìm JD bằng RAG + LLM formatting
├── shared/                # Python package dùng chung cho backend services
├── docs/                  # Tài liệu kiến trúc và luồng xử lý AI
├── pyproject.toml         # Python package config dùng chung cho BE
├── requirements.txt       # Python dependencies dùng chung cho BE
├── Makefile               # Lệnh chạy chung
└── .env                   # Environment chung cho BE
```

## FE

`frontend/` chứa giao diện người dùng và các route proxy để gọi backend:

| Phần | Vai trò |
|---|---|
| `src/app/page.tsx` | Màn tìm kiếm JD |
| `src/app/generate/page.tsx` | Màn nhập thông tin và tạo CV |
| `src/app/api/jd/search/route.ts` | Proxy tới `jd-search` service |
| `src/app/api/cv/generate/route.ts` | Proxy tới `generate-cv` service |
| `src/lib/api.ts` | Client API wrapper cho UI |
| `src/lib/types.ts` | TypeScript contracts dùng ở FE |
| `src/components/` | UI components |

Chạy FE:

```bash
cd frontend
npm install
npm run dev
```

Mặc định FE gọi:

```text
JD_SEARCH_URL=http://localhost:8001
GENERATE_CV_URL=http://localhost:8000
```

## BE

Backend hiện được tách thành hai service độc lập.

### Generate CV Service

`generate-cv/` phụ trách luồng tạo CV:

| Phần | Vai trò |
|---|---|
| `src/generate_cv/api/` | FastAPI endpoints |
| `src/generate_cv/services/` | Use-case layer cho API/CLI |
| `src/generate_cv/pipeline/` | LangGraph orchestration |
| `src/generate_cv/agents/` | AI agents tạo và kiểm tra nội dung CV |
| `src/generate_cv/rag/` | RAG examples cho CV writing |
| `templates/` | Template `.docx` |

Chạy service:

```bash
cd CVCraft
pip install -e ".[api,dev]"
uvicorn generate_cv.api.main:app --reload --port 8000
```

API chính:

```text
POST /v1/cv/generate
GET  /v1/cv/download
GET  /v1/cv/rag/stats
```

### JD Search Service

`jd-search/` phụ trách tìm kiếm JD và chuẩn hóa nội dung JD:

| Phần | Vai trò |
|---|---|
| `src/jd_search/api/` | FastAPI endpoints |
| `src/jd_search/services/` | Semantic search + AI formatting |
| `src/jd_search/rag/` | Vector store, loaders, indexing |
| `src/jd_search/agents/` | Package agent mở rộng nếu cần thêm logic AI cho JD search |
| `docs/` | Tài liệu riêng cho JD search |

Chạy service:

```bash
cd CVCraft
pip install -e ".[api,dev]"
uvicorn jd_search.api.main:app --reload --port 8001
```

API chính:

```text
POST /v1/jd/search
POST /v1/jd/index
GET  /v1/jd/stats
```

## Luồng Xử Lý AI

Tài liệu chi tiết nằm ở [docs/ai-flow.md](docs/ai-flow.md).

Tóm tắt:

```text
User
  |
  v
Frontend
  |
  +--> /api/jd/search -----> jd-search service
  |                            |
  |                            +--> Embed query
  |                            +--> Query ChromaDB
  |                            +--> Format JD sections bằng LLM
  |
  +--> /api/cv/generate ---> generate-cv service
                               |
                               +--> jd_analyzer
                               +--> user_profile
                               +--> summary_agent
                               +--> experience_agent
                               +--> skills_agent
                               +--> qc_agent
                               +--> template_renderer
```

## Cấu Hình

Tạo một `.env` chung ở root project:

```text
CVCraft/.env
```

Biến bắt buộc:

```env
OPENAI_API_KEY=sk-...
```

Biến FE nếu muốn đổi endpoint:

```env
JD_SEARCH_URL=http://localhost:8001
GENERATE_CV_URL=http://localhost:8000
```

## Lệnh Thường Dùng

```bash
# Cài backend packages dùng chung
pip install -e ".[api,dev]"

# FE
cd frontend
npm run dev

# Generate CV API
cd CVCraft
uvicorn generate_cv.api.main:app --reload --port 8000

# JD Search API
cd CVCraft
uvicorn jd_search.api.main:app --reload --port 8001

# Tests backend
pytest
```

## Ghi Chú Kiến Trúc

- FE không gọi trực tiếp FastAPI từ browser, mà đi qua Next.js API routes để gom cấu hình endpoint.
- `generate-cv` và `jd-search` là hai backend service tách biệt để dễ chạy, test và scale riêng.
- `shared` giữ phần hạ tầng dùng chung cho backend services, nhưng package metadata và dependencies được quản lý ở root.
- AI flow nằm chủ yếu trong `generate-cv/src/generate_cv/agents` và `generate-cv/src/generate_cv/pipeline`.
