# CVCraft — Hướng Dẫn Test

> Tài liệu này hướng dẫn test từng tính năng theo luồng thực tế.

## Yêu cầu trước khi test

| Service | Port | Bắt buộc |
|---------|------|----------|
| Frontend (Next.js) | 3000 | ✅ |
| Python AI (FastAPI) | 8000 | ✅ (để test tạo CV) |
| Java Backend (Spring Boot) | 8080 | ✅ (để test Auth / Profile / CV Library) |
| PostgreSQL | 5432 | ✅ (cho Java backend) |
| Redis | 6379 | ❌ (tuỳ chọn, có cache sẽ nhanh hơn) |

---

## Mục lục

1. [Auth — Đăng ký & Đăng nhập](#1-auth--đăng-ký--đăng-nhập)
2. [AI CV Builder — Tạo CV](#2-ai-cv-builder--tạo-cv)
3. [JD Search — Tìm mô tả công việc](#3-jd-search--tìm-mô-tả-công-việc)
4. [CV Library — Thư viện CV](#4-cv-library--thư-viện-cv)
5. [Profile — Hồ sơ cá nhân](#5-profile--hồ-sơ-cá-nhân)
6. [Dashboard — Tổng quan](#6-dashboard--tổng-quan)
7. [Checklist tổng hợp](#7-checklist-tổng-hợp)

---

## 1. Auth — Đăng ký & Đăng nhập

### 1.1 Đăng ký tài khoản mới

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/auth/register | Hiện form đăng ký (không có chọn role) |
| 2 | Điền: `user@test.com` / `Test1234!` / `Nguyen Van A` | — |
| 3 | Click **Tạo tài khoản** | Chuyển sang `/dashboard` |
| 4 | Kiểm tra Navbar | Hiện tên user + avatar chữ cái đầu |

### 1.2 Đăng nhập

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/auth/login | — |
| 2 | Nhập email + password | — |
| 3 | Click **Đăng nhập** | Chuyển về trang chủ, Navbar hiện tên |
| 4 | Click tên user ở Navbar | Dropdown: Dashboard, Build CV, Profile Settings, Sign Out |
| 5 | Click **Đăng xuất** | Logout, Navbar về trạng thái chưa đăng nhập |

### 1.3 Test lỗi

| Tình huống | Kết quả mong đợi |
|------------|------------------|
| Đăng ký email đã tồn tại | Lỗi `Email already registered` |
| Đăng nhập sai password | Lỗi `Invalid email or password` |
| Password < 8 ký tự | Lỗi validation ngay trên form |

### 1.4 Test API qua Swagger

http://localhost:8080/api/swagger-ui.html → mục **Authentication**

```json
POST /auth/register
{
  "email": "test@example.com",
  "password": "Test1234!",
  "fullName": "Nguyen Van A"
}
```

---

## 2. AI CV Builder — Tạo CV

> **Yêu cầu:** `OPENAI_API_KEY` đã set trong `.env`, Python backend đang chạy (port 8000).

### 2.1 Tạo CV cơ bản

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/cv/generate | Hiện form tạo CV |
| 2 | Điền thông tin cá nhân (tên, email, vị trí muốn apply) | — |
| 3 | Paste Job Description vào ô JD | — |
| 4 | Chọn template (5 lựa chọn) | Preview template thay đổi |
| 5 | Click **Generate CV** | Loading spinner, đợi ~30-60s |
| 6 | Xem Quality Score | ATS Score / JD Match / Linguistic hiện dưới dạng % |
| 7 | Xem CV preview | Nội dung CV được tạo đúng ngôn ngữ JD |
| 8 | Click **Download DOCX** | File `.docx` tải về máy |

### 2.2 Tạo CV bất đồng bộ (async)

```bash
# Gửi yêu cầu
curl -X POST http://localhost:8000/v1/cv/generate/async \
  -H "Content-Type: application/json" \
  -d '{"user_input": {...}, "jd_text": "..."}'

# Nhận: { "task_id": "abc-123" }

# Poll trạng thái
curl http://localhost:8000/v1/cv/tasks/abc-123
# Kết quả: { "status": "processing" | "done" | "failed" }
```

### 2.3 Test quality score

| Trường hợp | Kết quả mong đợi |
|------------|------------------|
| JD rõ ràng, kỹ năng khớp | ATS Score ≥ 75 |
| JD không rõ, kỹ năng không khớp | ATS Score < 60, có feedback gợi ý |
| Feedback section | Hiện danh sách điểm cần cải thiện |

### 2.4 Xem lịch sử

```bash
GET http://localhost:8000/v1/cv/history
# Trả về 20 CV gần nhất
```

---

## 3. JD Search — Tìm mô tả công việc

> **Yêu cầu:** Python backend đang chạy, JD index đã được build (`make jd-build-seed-index`).

### 3.1 Tìm kiếm cơ bản

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/jd/search | Hiện ô search + suggestion chips |
| 2 | Gõ `Senior React Developer` → Search | Trả về danh sách JD liên quan |
| 3 | Xem card kết quả | Hiện: title, requirements bullets, benefits bullets |
| 4 | Click **Tạo CV theo JD** trên một card | Chuyển sang `/cv/generate` với JD đã điền sẵn |

### 3.2 Test các query

| Query | Kết quả mong đợi |
|-------|------------------|
| `Data Scientist` | JD về data science, ML |
| `Product Manager` | JD về PM |
| `Kỹ sư phần mềm` | JD bằng tiếng Việt hoặc tiếng Anh |
| Query rất ngắn `react` | Vẫn trả kết quả liên quan |
| Query không tồn tại `xyzabc123` | Hiện "No results found" |

### 3.3 Test API trực tiếp

```bash
curl -X POST http://localhost:8000/v1/jd/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Senior React Developer with TypeScript"}'
```

---

## 4. CV Library — Thư viện CV

> **Yêu cầu:** Đăng nhập, Java backend đang chạy.

### 4.1 Lưu CV vào thư viện

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Tạo xong CV (Mục 2.1) | — |
| 2 | Click **Lưu vào thư viện** (nếu có nút) hoặc qua Swagger | CV xuất hiện trong `/dashboard` |
| 3 | Vào http://localhost:3000/dashboard | Thấy CV card vừa lưu |
| 4 | Kiểm tra CV card | Hiện: title, ATS score, JD title, ngày tạo, nút Download |

### 4.2 Quản lý CV Library qua Swagger

http://localhost:8080/api/swagger-ui.html → **CV Library**

```json
// Lưu CV mới
POST /cv-docs
{
  "title": "Senior React Developer CV",
  "templateId": "template_1",
  "fileName": "cv_2024.docx",
  "downloadUrl": "http://localhost:8000/v1/cv/download?path=...",
  "atsScore": 82,
  "jdTitle": "Senior React Developer at Tech Corp"
}

// Danh sách CV
GET /cv-docs

// Đặt làm CV chính
PATCH /cv-docs/{id}/primary

// Xóa CV
DELETE /cv-docs/{id}
```

### 4.3 Test tương tác UI

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Click **Set Primary** trên một CV card | Badge "Primary" xuất hiện, CV khác mất badge |
| 2 | Click **Delete** | Confirm dialog → CV biến mất khỏi danh sách |
| 3 | Click **Download** | File `.docx` tải về |
| 4 | Click **+ Create New CV** card | Chuyển sang `/cv/generate` |

### 4.4 Test với nhiều CV

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Tạo 3-4 CV khác nhau | Grid hiện đúng số lượng cards |
| 2 | Stats bar | "Saved CVs" tăng đúng số, "Best ATS Score" hiện điểm cao nhất |
| 3 | Không có CV | Hiện empty state với nút "Build My First CV" |

---

## 5. Profile — Hồ sơ cá nhân

> **Yêu cầu:** Đăng nhập.

### 5.1 Xem profile

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào `/dashboard` → tab **Profile** | Hiện các field: headline, location, experience, skills, links |
| 2 | Trường nào trống | Không hiện (ẩn trường null) |
| 3 | Click **Edit Full Profile →** | Chuyển sang `/profile` |

### 5.2 Cập nhật profile qua Swagger

```json
PUT /profile
{
  "headline": "Senior Frontend Developer | React & TypeScript",
  "bio": "5+ years building scalable web apps",
  "location": "Ho Chi Minh City",
  "experienceYears": 5,
  "experienceLevel": "SENIOR",
  "skills": ["React", "TypeScript", "Node.js", "AWS"],
  "linkedinUrl": "https://linkedin.com/in/test",
  "githubUrl": "https://github.com/test"
}
```

→ Response 200 với profile đã cập nhật.

### 5.3 Kiểm tra profile completion

| Trạng thái | Kết quả mong đợi |
|------------|------------------|
| Profile trống | "Profile Complete: 0%" |
| Điền headline + skills | "Profile Complete: ~33%" |
| Điền đầy đủ 6 fields | "Profile Complete: 100%" |

---

## 6. Dashboard — Tổng quan

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/dashboard | Loading → hiện dashboard |
| 2 | Chưa đăng nhập | Redirect về `/auth/login` |
| 3 | Stats bar (4 ô) | Saved CVs / Best ATS Score / Skills Listed / Profile Complete |
| 4 | Tab **My CVs** (default) | Grid CV cards hoặc empty state |
| 5 | Tab **Profile** | Thông tin profile ngắn gọn + link Edit |
| 6 | Click **Build New CV** button | Chuyển sang `/cv/generate` |

### 6.1 Test redirect cũ

| URL cũ | Kết quả mong đợi |
|--------|------------------|
| http://localhost:3000/jobs | Redirect về `/cv/generate` |
| http://localhost:3000/jobs/123 | Redirect về `/cv/generate` |
| http://localhost:3000/candidates | Redirect về `/dashboard` |
| http://localhost:3000/jobs/post | Redirect về `/cv/generate` |
| http://localhost:3000/dashboard/recruiter | Redirect về `/dashboard/candidate` |

---

## 7. Checklist tổng hợp

```
Auth
[ ] Đăng ký tài khoản mới (không có chọn role)
[ ] Đăng nhập → vào dashboard
[ ] Đăng xuất
[ ] Đăng ký email trùng → hiện lỗi

AI CV Builder
[ ] Tạo CV với JD đầy đủ → ATS score ≥ 60
[ ] Chọn template khác nhau → preview đổi
[ ] Download file .docx thành công
[ ] Quality score hiện đúng 3 chỉ số

JD Search
[ ] Tìm "React Developer" → có kết quả
[ ] Click "Tạo CV theo JD" → JD điền sẵn vào form
[ ] Query không tồn tại → "No results found"

CV Library
[ ] Lưu CV vào thư viện qua Swagger
[ ] CV card hiện đúng: title, ATS score, ngày
[ ] Set Primary → badge đổi đúng
[ ] Delete CV → biến mất khỏi grid
[ ] Stats: "Saved CVs" đếm đúng

Profile
[ ] GET /profile → trả đúng data
[ ] PUT /profile → cập nhật thành công
[ ] Dashboard tab Profile hiện đúng fields

Redirects
[ ] /jobs → /cv/generate
[ ] /candidates → /dashboard
[ ] /dashboard/recruiter → /dashboard/candidate
```

---

## URLs tham khảo nhanh

| URL | Mô tả |
|-----|-------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/auth/register | Đăng ký |
| http://localhost:3000/auth/login | Đăng nhập |
| http://localhost:3000/cv/generate | **Tạo CV bằng AI** |
| http://localhost:3000/jd/search | Tìm JD |
| http://localhost:3000/dashboard | Thư viện CV + Dashboard |
| http://localhost:8000/docs | Swagger Python AI |
| http://localhost:8080/api/swagger-ui.html | Swagger Java API |
| http://localhost:8000/health | Health check |
