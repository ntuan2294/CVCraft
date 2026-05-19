# Hướng dẫn chạy dự án CVCraft

## Yêu cầu hệ thống

- Python 3.11 trở lên
- Node.js 18 trở lên
- npm

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

### 3. Kiểm tra file .env

Đảm bảo file `.env` ở thư mục gốc có nội dung:

```
OPENAI_API_KEY=sk-...  (key của bạn)
```

---

## Chạy dự án (mỗi lần mở máy)

Mở **1 terminal PowerShell**, chạy lần lượt:

```powershell
cd "c:\Users\tuann\OneDrive\Desktop\New folder\CVCraft"
.venv\Scripts\Activate.ps1
python scripts/dev.py
```

Kết quả thành công sẽ hiển thị:

```
[dev] Frontend:    http://localhost:3000
[dev] Generate CV: http://localhost:8000/docs
[dev] JD Search:   http://localhost:8001/docs
[dev] Press Ctrl+C to stop all services.
```

Mở trình duyệt vào: **http://localhost:3000**

Nhấn **Ctrl+C** để dừng toàn bộ dự án.

---

## Thay đổi port (tùy chọn)

Nếu port mặc định bị chiếm, có thể chỉ định port khác:

```powershell
python scripts/dev.py --generate-port 8010 --jd-port 8011 --frontend-port 3001
```

---

## Tại sao server bị dừng đột ngột?

Script `scripts/dev.py` chạy 3 service cùng lúc và giám sát chúng. Nếu **bất kỳ 1 service nào bị crash**, toàn bộ sẽ dừng theo để tránh chạy ở trạng thái thiếu backend.

### Cách đọc log khi bị lỗi

Khi thấy dòng:
```
[dev] A service exited with code 1. Stopped remaining services.
```

Nhìn lên phía trên, tìm dòng log `[generate-cv]` hoặc `[jd-search]` có thông báo lỗi — đó là service bị crash đầu tiên.

### Các lỗi thường gặp và cách sửa

| Lỗi trong log | Nguyên nhân | Cách sửa |
|---|---|---|
| `ModuleNotFoundError` | Chưa cài packages hoặc chưa activate venv | Chạy lại `pip install -e ".[api,dev]"` sau khi activate venv |
| `AuthenticationError` hoặc `openai` | Sai hoặc thiếu `OPENAI_API_KEY` | Kiểm tra file `.env` ở thư mục gốc |
| `Address already in use` | Port đang bị dùng bởi chương trình khác | Dùng tham số `--generate-port`, `--jd-port`, `--frontend-port` để đổi port |
| `Error: Cannot find module` | Chưa cài npm packages | Vào thư mục `frontend` và chạy `npm install` |
| Lỗi ChromaDB | Vector store khởi tạo thất bại | Xóa thư mục `.chroma` nếu có, rồi chạy lại |

---

## Cac URL quan trọng

| Service | URL |
|---|---|
| Giao diện chính | http://localhost:3000 |
| API Generate CV (Swagger docs) | http://localhost:8000/docs |
| API JD Search (Swagger docs) | http://localhost:8001/docs |

---

## Luu y bao mat

- File `.env` chua `OPENAI_API_KEY` — **tuyet doi khong commit file nay len GitHub**.
- Them `.env` vao `.gitignore` neu chua co.
