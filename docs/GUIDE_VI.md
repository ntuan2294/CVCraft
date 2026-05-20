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
| Git     | Bất kỳ              | `git --version` |

> **Redis** là tuỳ chọn. App chạy bình thường không có Redis (dùng in-memory cache thay thế).

---

## 2. Cấu trúc dự án

```
CVCraft/
├── backend/                    ← Python AI services (FastAPI)
│   ├── src/cvcraft/
│   │   ├── config/             ← Settings (API key, paths, Redis, rate limits)
│   │   ├── infrastructure/
│   │   │   ├── cache/          ← Redis cache layer (với in-memory fallback)
│   │   │   ├── llm/            ← LLM factory (OpenAI)
│   │   │   └── rate_limit/     ← Rate limiting (slowapi)
│   │   ├── generate_cv/        ← Pipeline tạo CV (LangGraph 6-agent)
│   │   │   ├── agents/         ← jd_analyzer, summary, experience, skills, qc, renderer
│   │   │   ├── pipeline/       ← Orchestration graph
│   │   │   ├── rag/            ← Vector store + RAG examples
│   │   │   ├── services/       ← CVService, RAGService, CVTaskService
│   │   │   └── api/v1/cv.py    ← REST endpoints /v1/cv/*
│   │   └── jd_search/          ← Tìm kiếm JD semantic
│   │       ├── rag/            ← ChromaDB + loaders
│   │       ├── services/       ← JDSearchService (Redis cache)
│   │       └── api/v1/jd.py    ← REST endpoints /v1/jd/*
│   ├── data/vectordb/          ← ChromaDB local (tự động tạo, không commit)
│   ├── outputs/                ← CV đã tạo (.docx) (không commit)
│   └── templates/              ← 5 mẫu CV (.docx)
├── frontend/                   ← Next.js 16 UI
│   ├── src/app/                ← Pages
│   ├── src/components/         ← Shared components
│   ├── src/features/           ← Feature modules (generate-cv)
│   └── src/lib/                ← API clients, types, i18n
├── cvcraft-backend/            ← Java Spring Boot API (tách biệt)
├── docs/                       ← Tài liệu dự án
├── scripts/dev.py              ← Khởi động toàn bộ stack
├── gateway.py                  ← FastAPI entry point (mount 2 router vào 1 port)
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

Kích hoạt virtual environment:

```powershell
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# macOS / Linux
source .venv/bin/activate
```

Sau khi kích hoạt, prompt sẽ có dạng `(.venv) PS C:\...>`.

### Bước 3 — Cài Python packages

```powershell
# Bản cơ bản (backend + dev tools)
pip install -e ".[api,dev]"

# Nếu muốn dùng Redis cache + Rate limiting (khuyên dùng cho production)
pip install -e ".[api,dev,cache,ratelimit]"
```

### Bước 4 — Cài Frontend packages

```powershell
cd frontend
npm install
cd ..
```

### Bước 5 — Tạo file `.env`

Sao chép từ template:

```powershell
copy .env.example .env
```

Mở file `.env` và điền API key (xem [Mục 4](#4-cấu-hình-biến-môi-trường)).

---

## 4. Cấu hình biến môi trường

File `.env` đặt ở **thư mục gốc** của dự án.

### Bắt buộc

```env
OPENAI_API_KEY=sk-...
```

Lấy API key tại: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Tuỳ chọn

```env
# Redis — bật cache và rate limiting qua Redis
# Nếu không đặt, app dùng in-memory (vẫn chạy bình thường)
REDIS_URL=redis://localhost:6379/0

# URL backend mà frontend gọi tới
GENERATE_CV_URL=http://localhost:8000

# URL công khai của backend (dùng để OnlyOffice gọi lại)
PUBLIC_API_URL=http://localhost:8000

# OnlyOffice Document Server — bật chỉnh sửa CV giống Word trên trình duyệt
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
```

### Bảng tóm tắt

| Biến | Bắt buộc | Mô tả | Mặc định |
|------|----------|-------|----------|
| `OPENAI_API_KEY` | ✅ | API key OpenAI | — |
| `REDIS_URL` | ❌ | URL Redis server | `redis://localhost:6379/0` |
| `GENERATE_CV_URL` | ❌ | URL backend cho FE | `http://localhost:8000` |
| `PUBLIC_API_URL` | ❌ | URL backend công khai | `http://localhost:8000` |
| `ONLYOFFICE_DOCUMENT_SERVER_URL` | ❌ | URL OnlyOffice server | (tắt) |

---

## 5. Chạy dự án

### Cách 1 — Chạy toàn bộ stack (khuyên dùng)

Mở **1 terminal**, chạy:

```powershell
.venv\Scripts\Activate.ps1
python scripts/dev.py
```

Khi thấy log sau là sẵn sàng:

```
[dev] Frontend: http://localhost:3000
[dev] Backend:  http://localhost:8000/docs
[dev] Press Ctrl+C to stop all services.
```

Mở trình duyệt: **http://localhost:3000**

Nhấn **Ctrl+C** để dừng tất cả.

---

### Cách 2 — Chạy riêng từng service

Mở **2 terminal** riêng biệt:

**Terminal 1 — Backend:**

```powershell
.venv\Scripts\Activate.ps1
uvicorn gateway:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd frontend
npm run dev
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
| **Tạo CV** | http://localhost:3000/cv/generate | Form tạo CV |
| **Tìm việc** | http://localhost:3000/jd/search | Tìm JD semantic |
| **Swagger UI** | http://localhost:8000/docs | API docs tương tác |
| **ReDoc** | http://localhost:8000/redoc | API docs đọc |
| **Health check** | http://localhost:8000/health | Trạng thái server + Redis |
| **Cache stats** | http://localhost:8000/v1/cv/cache/stats | Thống kê Redis cache |

---

## 7. API Reference

### CV Generation

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/v1/cv/generate` | Tạo CV **đồng bộ** (~30-60s, block) |
| `POST` | `/v1/cv/generate/async` | Tạo CV **bất đồng bộ** — trả ngay `task_id` |
| `GET`  | `/v1/cv/tasks/{task_id}` | Poll trạng thái task async |
| `GET`  | `/v1/cv/history` | Lịch sử 20 lần tạo CV gần nhất |
| `DELETE` | `/v1/cv/history` | Xoá lịch sử |
| `GET`  | `/v1/cv/download?path=...` | Tải file `.docx` |
| `GET`  | `/v1/cv/cache/stats` | Thống kê Redis cache |

### JD Search

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/v1/jd/search` | Tìm kiếm JD theo semantic search |
| `POST` | `/v1/jd/index` | Index JD mới vào vector store |
| `GET`  | `/v1/jd/stats` | Thống kê JD collection |

### RAG Management

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/v1/cv/rag/stats` | Thống kê CV RAG index |
| `POST` | `/v1/cv/rag/build` | Build RAG index (`seed` / `hf` / `kaggle`) |
| `GET`  | `/v1/cv/rag/build/status` | Trạng thái build đang chạy |

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

Redis giúp tăng tốc đáng kể bằng cách cache:
- Kết quả tìm kiếm JD theo query (TTL 1 giờ)
- JD sections đã format bởi LLM (TTL 24 giờ)
- CV task state (TTL 24 giờ)

**Cài Redis trên Windows (khuyên dùng Docker):**

```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

Sau đó thêm vào `.env`:

```env
REDIS_URL=redis://localhost:6379/0
```

Kiểm tra kết nối tại: http://localhost:8000/health

---

### OnlyOffice — Chỉnh sửa CV giống Word trên trình duyệt

```powershell
docker run -d --name onlyoffice -p 8080:80 --restart=always onlyoffice/documentserver
```

Thêm vào `.env`:

```env
PUBLIC_API_URL=http://host.docker.internal:8000
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
```

> **Lưu ý:** `PUBLIC_API_URL` phải là URL mà OnlyOffice container có thể truy cập được tới backend. Trên Windows/Mac dùng `host.docker.internal`, trên Linux dùng IP thực của máy.

---

### Build RAG Index

RAG index giúp AI tạo CV chất lượng hơn bằng cách học từ ví dụ:

```powershell
# Build từ seed samples có sẵn (~5 giây, đủ để test)
make build-index

# Build JD search index
make jd-build-seed-index

# Build từ HuggingFace dataset (cần internet, mất vài phút)
curl -X POST http://localhost:8000/v1/cv/rag/build \
  -H "Content-Type: application/json" \
  -d '{"source": "hf", "max_records": 500}'
```

---

## 9. Lệnh thường dùng

```powershell
# Cài đặt
make install              # Cài Python packages
make frontend-install     # Cài npm packages

# Chạy
make dev                  # Chạy toàn bộ app (backend + frontend)
make api                  # Chạy backend riêng
make frontend             # Chạy frontend riêng

# RAG
make build-index          # Build CV RAG index (seed)
make jd-build-seed-index  # Build JD index (seed)
make rag-stats            # Xem thống kê RAG
make jd-stats             # Xem thống kê JD index

# Dev
make test                 # Chạy test suite
make lint                 # Kiểm tra code style (ruff)
```

---

## 10. Xử lý lỗi thường gặp

### Lỗi khi chạy `python scripts/dev.py`

| Lỗi trong log | Nguyên nhân | Cách sửa |
|---------------|-------------|----------|
| `ModuleNotFoundError: No module named 'cvcraft'` | Chưa cài packages hoặc chưa activate venv | Kích hoạt venv rồi chạy `pip install -e ".[api,dev]"` |
| `AuthenticationError` / `Incorrect API key` | Sai hoặc thiếu `OPENAI_API_KEY` | Kiểm tra file `.env` ở thư mục gốc |
| `Address already in use` | Port đang bị chiếm bởi process khác | Đổi port: `python scripts/dev.py --backend-port 8010` |
| `Error: Cannot find module` | Chưa cài npm packages | Vào `frontend/` và chạy `npm install` |
| `Cannot find module 'next'` | npm install chưa xong | Chạy lại `cd frontend && npm install` |

### Lỗi về quyền trên PowerShell

```
.venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled
```

**Sửa:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend crash ngay sau khi start

Script `dev.py` dừng toàn bộ nếu **bất kỳ service nào crash**. Đọc log để tìm lỗi:

```
[backend] ERROR: ...lỗi cụ thể...
[dev] A service exited with code 1. Stopped remaining services.
```

Kiểm tra file `.env` có đúng `OPENAI_API_KEY` chưa — đây là nguyên nhân phổ biến nhất.

### Reset dữ liệu RAG

Nếu vector store bị lỗi hoặc muốn build lại từ đầu:

```powershell
# Xoá thủ công
Remove-Item -Recurse -Force backend\data\vectordb

# Build lại
make build-index
make jd-build-seed-index
```

---

## Lưu ý bảo mật

- File `.env` chứa API key — **không bao giờ commit lên Git**
- `.env.example` đã có sẵn placeholder để chia sẻ với team — an toàn để commit
- Rate limiting tự động giới hạn: 10 req/phút/IP cho CV generation, 30 req/phút/IP cho JD search
