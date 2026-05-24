# CVCraft

Ứng dụng AI hỗ trợ **tạo CV** và **đánh giá CV theo JD**, sử dụng LangGraph multi-agent, ChromaDB RAG, và OpenAI.

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Python  | 3.11+     |
| Node.js | 18+       |
| Java    | 17+ *(tùy chọn — chỉ cần cho tính năng đăng nhập/lưu CV)* |

## Cài đặt

### 1. Clone repo

```bash
git clone <repo-url>
cd CVCraft
```

### 2. Tạo môi trường Python

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 3. Cài Python dependencies

```bash
pip install -e ".[api]"
```

### 4. Cấu hình biến môi trường

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Mở `.env`, thay `sk-proj-your_openai_api_key_here` bằng API key thực của bạn (lấy tại https://platform.openai.com/api-keys).

### 5. Cài frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 6. Chạy ứng dụng

```bash
python scripts/dev.py
```

Script tự động khởi động Python backend (port 8000) và Next.js frontend (port 3000).

> **Lần đầu chạy:** backend tự động tải và index dữ liệu JD + CV mẫu từ HuggingFace — mất khoảng 2-5 phút.

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| API docs | http://localhost:8000/docs |

---

## Chạy không cần Java backend

Bỏ tính năng đăng nhập / lưu CV:

```bash
python scripts/dev.py --no-java
```

## Chạy riêng từng service

```bash
# Python backend
uvicorn gateway:app --reload --port 8000

# Frontend (terminal khác)
cd frontend && npm run dev
```

---

## Tính năng

- **Tìm kiếm JD** — Vector search theo mô tả công việc
- **Sinh CV** — Tạo CV HTML từ thông tin người dùng + JD qua LangGraph 7-node pipeline
- **Đánh giá CV** — Tải CV (PDF/DOCX/ảnh) + JD → nhận điểm số, nhận xét, gợi ý cải thiện

## Cấu trúc

```
CVCraft/
├── backend/src/cvcraft/
│   ├── generate_cv/       # Pipeline sinh CV (LangGraph)
│   ├── review_cv/         # Pipeline đánh giá CV
│   ├── jd_search/         # Tìm kiếm JD (ChromaDB RAG)
│   └── config/            # Settings, biến môi trường
├── frontend/              # Next.js frontend
├── cvcraft-backend/       # Java Spring Boot (Auth + Profile)
├── gateway.py             # FastAPI entry point
└── scripts/dev.py         # Script khởi động tất cả services
```

## Stack

| Layer       | Công nghệ                                    |
|-------------|----------------------------------------------|
| Frontend    | Next.js 16, React 19, TypeScript, Tailwind   |
| Python AI   | FastAPI, LangGraph, ChromaDB, OpenAI         |
| Java        | Spring Boot 3, Spring Security/JWT, PostgreSQL |
