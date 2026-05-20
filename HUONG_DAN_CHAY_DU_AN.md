# Hướng dẫn chạy dự án CVCraft

## Yêu cầu hệ thống

- Python 3.11 trở lên
- Node.js 18 trở lên
- npm

---

## Cấu trúc dự án

```
CVCraft/
├── backend/          ← toàn bộ Python backend (generate CV + JD search)
│   ├── src/cvcraft/
│   ├── data/vectordb/
│   └── outputs/
├── frontend/         ← Next.js frontend
├── gateway.py        ← entry point FastAPI (mount cả 2 router vào 1 port)
├── pyproject.toml
└── scripts/dev.py    ← khởi động cả 2 service cùng lúc
```

---

## Lần đầu tiên cài đặt

Chỉ cần thực hiện các bước này **một lần duy nhất**.

### 1. Tạo virtual environment và cài Python packages

Mở PowerShell, di chuyển vào thư mục dự án:

```powershell
cd "c:\Users\tuann\OneDrive\Desktop\New folder\CVCraft"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[api,dev]"
```

### 2. Cài đặt Frontend packages

```powershell
cd frontend
npm install
cd ..
```

### 3. Tạo file .env

Tạo file `.env` ở thư mục gốc với nội dung:

```
OPENAI_API_KEY=sk-...
PUBLIC_API_URL=http://localhost:8000
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
```

`ONLYOFFICE_DOCUMENT_SERVER_URL` là URL của OnlyOffice Docs / Document Server. Nếu chưa cấu hình biến này, app sẽ tự quay về chế độ preview/edit đơn giản.

---

## Chạy dự án (mỗi lần mở máy)

Mở **1 terminal PowerShell**, chạy:

```powershell
cd "c:\Users\tuann\OneDrive\Desktop\New folder\CVCraft"
.venv\Scripts\Activate.ps1
python scripts/dev.py
```

Khi thấy log sau là thành công:

```
[dev] Frontend: http://localhost:3000
[dev] Backend:  http://localhost:8000/docs
[dev] Press Ctrl+C to stop all services.
```

Mở trình duyệt: **http://localhost:3000**

Nhấn **Ctrl+C** để dừng.

---

## Chạy từng service riêng lẻ

```powershell
# Backend (cả generate CV + JD search trên cùng 1 port)
uvicorn gateway:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Chạy OnlyOffice Docs để edit giống Word

Bạn cần chạy thêm OnlyOffice Document Server, ví dụ bằng Docker:

```powershell
docker run -i -t -d -p 8080:80 --restart=always onlyoffice/documentserver
```

Sau đó đảm bảo `.env` có:

```
PUBLIC_API_URL=http://host.docker.internal:8000
ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
```

Nếu không dùng Docker Desktop hoặc Document Server chạy trên máy khác, đặt `PUBLIC_API_URL` thành URL mà OnlyOffice Document Server có thể truy cập được tới backend.

---

## Thay đổi port

```powershell
python scripts/dev.py --backend-port 8010 --frontend-port 3001
```

---

## Các URL quan trọng

| Service | URL |
|---|---|
| Giao diện chính | http://localhost:3000 |
| API Swagger docs | http://localhost:8000/docs |
| Generate CV endpoints | http://localhost:8000/v1/cv/... |
| JD Search endpoints | http://localhost:8000/v1/jd/... |
| Health check | http://localhost:8000/health |

---

## Tại sao server bị dừng đột ngột?

Script `scripts/dev.py` chạy 2 service (backend + frontend) cùng lúc và giám sát. Nếu **bất kỳ service nào bị crash**, toàn bộ sẽ dừng theo.

Nhìn vào log phía trên dòng:
```
[dev] A service exited with code 1. Stopped remaining services.
```

Tìm dòng `[backend]` hoặc `[frontend]` có thông báo lỗi.

### Các lỗi thường gặp

| Lỗi trong log | Nguyên nhân | Cách sửa |
|---|---|---|
| `ModuleNotFoundError` | Chưa cài packages hoặc chưa activate venv | Chạy lại `pip install -e ".[api,dev]"` sau khi activate venv |
| `AuthenticationError` | Sai hoặc thiếu `OPENAI_API_KEY` | Kiểm tra file `.env` ở thư mục gốc |
| `Address already in use` | Port đang bị chiếm | Dùng `--backend-port` hoặc `--frontend-port` để đổi port |
| `Error: Cannot find module` | Chưa cài npm packages | Vào thư mục `frontend` và chạy `npm install` |

---

## Lưu ý bảo mật

File `.env` chứa `OPENAI_API_KEY` — **tuyệt đối không commit file này lên GitHub**.
