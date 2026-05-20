``# CVCraft — Test Workflow

> Tài liệu này hướng dẫn test từng tính năng mới theo luồng thực tế.  
> **Yêu cầu:** Tất cả 4 service đang chạy (port 3000, 8000, 8001, 8080).

---

## Mục lục

b

---

## 1. Auth — Đăng ký & Đăng nhập

### 1.1 Đăng ký tài khoản Candidate

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/auth/register | Hiện form đăng ký |
| 2 | Chọn role **👤 Job Seeker** | Tab được highlight xanh |
| 3 | Điền: `candidate@test.com` / `Test1234!` / `Nguyen Van A` | — |
| 4 | Click **Create Account** | Chuyển sang `/dashboard/candidate` |
| 5 | Kiểm tra Navbar | Hiện tên user + avatar chữ cái đầu |

### 1.2 Đăng ký tài khoản Recruiter

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/auth/register | — |
| 2 | Chọn role **🏢 Recruiter** | — |
| 3 | Điền: `recruiter@test.com` / `Test1234!` / `Tran Thi B` | — |
| 4 | Click **Create Account** | Chuyển sang `/dashboard/recruiter` |

### 1.3 Đăng nhập

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/auth/login | — |
| 2 | Nhập email + password đã đăng ký | — |
| 3 | Click **Sign In** | Chuyển về trang chủ, Navbar hiện tên |
| 4 | Click tên user ở Navbar | Dropdown hiện thông tin + role badge |
| 5 | Click **Sign Out** | Logout, Navbar về trạng thái chưa đăng nhập |

### 1.4 Test lỗi

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| — | Đăng ký email đã tồn tại | Hiện lỗi `Email already registered` |
| — | Đăng nhập sai password | Hiện lỗi `Invalid email or password` |
| — | Password < 8 ký tự | Hiện lỗi validation |

> **API test (Swagger):** http://localhost:8080/api/swagger-ui.html → mục **Authentication**

---

## 2. Company — Tạo công ty

> Đăng nhập bằng tài khoản **Recruiter** trước.

### 2.1 Tạo công ty qua Swagger

| Bước | Hành động |
|------|-----------|
| 1 | Vào http://localhost:8080/api/swagger-ui.html |
| 2 | Click **Authorize** → nhập Bearer token lấy từ bước login |
| 3 | Vào **POST /companies** → **Try it out** |
| 4 | Body mẫu: |

```json
{
  "name": "Tech Corp Vietnam",
  "description": "A leading software company",
  "industry": "Technology",
  "size": "51-200",
  "website": "https://techcorp.vn",
  "location": "Ho Chi Minh City"
}
```

| 5 | Execute → Response 201 với `id` và `slug` | ✅ |

---

## 3. Jobs — Đăng & quản lý việc làm

> Đăng nhập bằng tài khoản **Recruiter** + đã có công ty.

### 3.1 Đăng job mới

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/jobs/post | Hiện form đăng việc |
| 2 | **Title:** `Senior React Developer` | — |
| 3 | **Company:** chọn công ty vừa tạo | — |
| 4 | **Location:** `Ho Chi Minh City` | — |
| 5 | **Job Type:** `FULL_TIME` | — |
| 6 | **Experience Level:** `SENIOR` | — |
| 7 | **Work Mode:** `HYBRID` | — |
| 8 | **Salary:** Min `2000` / Max `4000` / USD | — |
| 9 | **Description:** điền mô tả chi tiết | — |
| 10 | **Skills:** `React, TypeScript, Node.js` | — |
| 11 | Click **Publish Job Post** | Chuyển sang trang detail job vừa tạo |

### 3.2 Cập nhật trạng thái job (Swagger)

```
PATCH /api/jobs/{id}/status?status=PAUSED
PATCH /api/jobs/{id}/status?status=OPEN
PATCH /api/jobs/{id}/status?status=CLOSED
```

### 3.3 Xem job của mình

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào `/dashboard/recruiter` → tab **Jobs** | Thấy job vừa đăng |
| 2 | Kiểm tra cột: views, applicants, status | Hiện đúng số liệu |

---

## 4. Jobs — Tìm kiếm & lọc

### 4.1 Tìm kiếm cơ bản

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/jobs | Hiện danh sách jobs |
| 2 | Gõ `React` vào ô search → click **Search** | Lọc ra jobs có "React" |
| 3 | Gõ `Ho Chi Minh` vào ô Location | Lọc theo địa điểm |

### 4.2 Dùng bộ lọc sidebar (desktop)

| Filter | Giá trị test | Kết quả mong đợi |
|--------|-------------|------------------|
| Job Type | `FULL_TIME` | Chỉ hiện full-time jobs |
| Experience Level | `SENIOR` | Chỉ hiện senior level |
| Work Mode | `HYBRID` | Chỉ hiện hybrid |
| Min Salary | `$80k+` | Chỉ hiện lương ≥ 80k |

### 4.3 Sắp xếp

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| — | Chọn **Most popular** | Sort theo view count giảm dần |
| — | Chọn **Salary: High to Low** | Sort theo lương giảm dần |
| — | Chọn **Newest first** | Sort theo ngày đăng mới nhất |

### 4.4 Xem chi tiết job

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Click vào một job card | Vào trang `/jobs/{id}` |
| 2 | Kiểm tra: tiêu đề, công ty, lương, mô tả | Hiện đầy đủ |
| 3 | Kiểm tra view count | Tăng thêm 1 mỗi lần vào trang |
| 4 | Kiểm tra skills badges | Hiện đúng danh sách skills |

---

## 5. Candidate Profile — Cập nhật hồ sơ

> Đăng nhập bằng tài khoản **Candidate**.

### 5.1 Cập nhật profile qua Swagger

| Bước | Hành động |
|------|-----------|
| 1 | Swagger → **PUT /candidates/me** |
| 2 | Body mẫu: |

```json
{
  "headline": "Senior Frontend Developer | React & TypeScript",
  "bio": "5+ years building scalable web applications",
  "location": "Ho Chi Minh City",
  "experienceYears": 5,
  "experienceLevel": "SENIOR",
  "skills": ["React", "TypeScript", "Node.js", "AWS"],
  "desiredSalaryMin": 2000,
  "desiredSalaryMax": 4000,
  "desiredWorkMode": "HYBRID",
  "isOpenToWork": true,
  "isProfileVisible": true,
  "linkedinUrl": "https://linkedin.com/in/test",
  "githubUrl": "https://github.com/test"
}
```

| 3 | Execute → Response 200 với profile đã cập nhật | ✅ |

### 5.2 Xem profile của mình

```
GET /api/candidates/me
```
→ Trả về đầy đủ thông tin profile vừa update.

---

## 6. Candidates — Browse & lọc ứng viên

> Có thể xem dưới cả 2 vai (Recruiter xem thì có nút shortlist).

### 6.1 Browse ứng viên

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/candidates | Thấy grid ứng viên |
| 2 | Kiểm tra card ứng viên | Hiện: tên, headline, location, skills, open-to-work badge |
| 3 | Click **View Profile →** | Vào trang `/candidates/{id}` |
| 4 | Kiểm tra profile counter | `profileViews` tăng 1 |

### 6.2 Lọc ứng viên

| Filter | Giá trị test |
|--------|-------------|
| Keyword | `React` |
| Location | `Ho Chi Minh` |
| Experience Level | `SENIOR` |
| Open to work only | ✅ tick vào |
| Work Mode | `HYBRID` |
| Years of Experience | Min `3` / Max `8` |

### 6.3 Shortlist ứng viên (Recruiter only)

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Đăng nhập Recruiter | — |
| 2 | Vào `/candidates` | Thấy icon bookmark ở góc mỗi card |
| 3 | Click icon bookmark | Icon chuyển sang màu xanh (đã shortlist) |
| 4 | Click lại | Bỏ shortlist, icon về xám |

---

## 7. Application — Ứng tuyển & theo dõi

### 7.1 Ứng tuyển vào job (Candidate)

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Đăng nhập Candidate | — |
| 2 | Vào `/jobs/{id}` của job đã tạo ở bước 3 | — |
| 3 | Click **Apply Now** | Hiện ô nhập cover letter |
| 4 | Điền cover letter (tùy chọn) | — |
| 5 | Click **Submit Application** | Nút đổi thành `✓ Application Submitted` |
| 6 | Thử apply lại cùng job | Hiện lỗi `already applied` |

### 7.2 Xem applications của mình (Candidate)

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào `/dashboard/candidate` → tab **Applications** | Thấy application vừa gửi |
| 2 | Kiểm tra status badge | Hiện `Pending` màu vàng |
| 3 | Kiểm tra thông tin job | Tên job, công ty, địa điểm đúng |

### 7.3 Recruiter xem & xử lý applications

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Đăng nhập Recruiter | — |
| 2 | Vào `/dashboard/recruiter` → tab **Applications** | — |
| 3 | Chọn job có ứng viên đã apply | Thấy danh sách applications |
| 4 | Đổi status thành `REVIEWING` | Status cập nhật ngay |
| 5 | Đổi tiếp thành `SHORTLISTED` | — |
| 6 | Đổi thành `INTERVIEW` | — |
| 7 | Cuối cùng `HIRED` hoặc `REJECTED` | — |

### 7.4 Luồng đầy đủ qua Swagger

```
# 1. Apply
POST /api/applications/jobs/{jobId}
Body: { "coverLetter": "I am interested..." }

# 2. Recruiter xem applications
GET /api/applications/jobs/{jobId}

# 3. Update status
PATCH /api/applications/{id}/status?status=SHORTLISTED&note=Good candidate

# 4. Candidate rút đơn
PATCH /api/applications/{id}/withdraw
```

### Luồng trạng thái application

```
PENDING → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED → HIRED
                                              ↘
                                           REJECTED
(Candidate có thể) → WITHDRAWN (bất kỳ lúc nào)
```

---

## 8. Bookmark — Lưu job & Shortlist ứng viên

### 8.1 Candidate lưu job yêu thích

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào trang detail `/jobs/{id}` | — |
| 2 | Click icon bookmark (góc phải) | Icon chuyển xanh, tooltip "Remove bookmark" |
| 3 | Reload trang | Bookmark vẫn còn (persisted) |
| 4 | Click lại | Bỏ bookmark |

### 8.2 Xem danh sách job đã lưu (Swagger)

```
GET /api/bookmarks?type=JOB
```

### 8.3 Recruiter shortlist ứng viên (Swagger)

```
POST /api/bookmarks/candidates/{candidateId}?note=Strong React skills

GET /api/bookmarks?type=CANDIDATE

DELETE /api/bookmarks/candidates/{candidateId}
```

---

## 9. Dashboard Candidate

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/dashboard/candidate | — |
| 2 | Tab **Overview** | Hiện: avatar, headline, profile views, số applications, số skills |
| 3 | Kiểm tra **Application Summary** | 4 ô: Pending / Interview / Offered / Hired với số đúng |
| 4 | Kiểm tra **Recent Applications** | Thấy 4 applications gần nhất |
| 5 | Tab **Applications** | Thấy toàn bộ danh sách với status badge màu |
| 6 | Tab **Profile** | Hiện link Edit Profile |
| 7 | Click **✨ Build CV** | Chuyển sang trang AI CV Builder |
| 8 | Click **Browse Jobs** | Chuyển sang trang `/jobs` |

---

## 10. Dashboard Recruiter

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/dashboard/recruiter | — |
| 2 | Kiểm tra **Stats bar** (4 ô) | Active Jobs / Total Jobs / Total Views / Applications |
| 3 | Tab **Jobs** | Thấy danh sách jobs đã đăng |
| 4 | Kiểm tra mỗi job row | views, applicants, ngày đăng đúng |
| 5 | Click **View Apps (N)** | Chuyển sang tab Applications, filter theo job đó |
| 6 | Đổi status job từ dropdown | Cập nhật ngay, reload lại list |
| 7 | Tab **Applications** | Chọn job từ dropdown |
| 8 | Thấy ứng viên đã apply | Tên, headline, ngày apply |
| 9 | Đổi status từ dropdown | Cập nhật real-time |
| 10 | Click **+ Post Job** | Chuyển sang form đăng việc |

---

## 11. AI CV Builder (tính năng cũ)

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/cv/generate | Hiện form tạo CV |
| 2 | Điền thông tin cá nhân | — |
| 3 | Paste Job Description vào | — |
| 4 | Click Generate | AI pipeline chạy (LangGraph) |
| 5 | Xem quality score | ATS / JD Match / Linguistic score |
| 6 | Download DOCX | File CV hoàn chỉnh |

> **Yêu cầu:** `OPENAI_API_KEY` đã được set trong file `.env`

---

## 12. JD Search (tính năng cũ)

| Bước | Hành động | Kết quả mong đợi |
|------|-----------|------------------|
| 1 | Vào http://localhost:3000/jd/search | Hiện ô search |
| 2 | Gõ `Senior React Developer` → Search | Trả về danh sách JD liên quan |
| 3 | Xem card kết quả | Hiện title, requirements, benefits đã format |
| 4 | Click suggestion chips | Tự điền query |

> **Yêu cầu:** JD Search service đang chạy ở port 8001 + đã index data

---

## Checklist tổng hợp

```
[ ] Auth: Register Candidate + Register Recruiter + Login/Logout
[ ] Company: Tạo công ty qua Swagger
[ ] Job: Đăng job → xem trong dashboard recruiter
[ ] Job Search: Tìm theo keyword + lọc sidebar
[ ] Job Detail: View count tăng khi vào trang
[ ] Candidate Profile: Update profile qua Swagger/API
[ ] Candidate Browse: Tìm + lọc + shortlist (recruiter)
[ ] Application: Apply job → theo dõi status
[ ] Application Pipeline: Recruiter đổi status PENDING → HIRED
[ ] Bookmark: Candidate lưu job + Recruiter shortlist ứng viên
[ ] Dashboard Candidate: Overview + Applications tab
[ ] Dashboard Recruiter: Jobs + Applications management
[ ] AI CV Builder: Generate CV với OpenAI
[ ] JD Search: Tìm kiếm semantic JD
```

---

## URLs tham khảo nhanh

| URL | Mô tả |
|-----|--------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/auth/register | Đăng ký |
| http://localhost:3000/auth/login | Đăng nhập |
| http://localhost:3000/jobs | Danh sách việc làm |
| http://localhost:3000/jobs/post | Đăng việc làm |
| http://localhost:3000/candidates | Browse ứng viên |
| http://localhost:3000/dashboard/candidate | Dashboard ứng viên |
| http://localhost:3000/dashboard/recruiter | Dashboard nhà tuyển dụng |
| http://localhost:3000/cv/generate | AI CV Builder |
| http://localhost:3000/jd/search | JD Search |
| http://localhost:8080/api/swagger-ui.html | Swagger API docs |
