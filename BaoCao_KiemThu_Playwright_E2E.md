# Báo Cáo Kiểm Thử End-to-End (Playwright) — CVCraft

> **Phạm vi:** Toàn bộ 6 tệp đặc tả kiểm thử Playwright trong thư mục `frontend/e2e/`  
> **Ngày kiểm tra:** 24/05/2026  
> **Công cụ:** Playwright Test — TypeScript, trình duyệt Chromium, chạy tuần tự (workers: 1)  
> **Kết quả:** Phát hiện **2 lỗi nghiêm trọng** + **6 test case còn thiếu** — đã được sửa toàn bộ

---

## 1. Tổng quan về bộ kiểm thử

| Tệp test | Nhóm tính năng | Use case liên quan |
|---|---|---|
| `01-landing.spec.ts` | Trang chủ & điều hướng | UC-01 (guest), Admin entry |
| `02-auth.spec.ts` | Xác thực & tài khoản | UC-01, UC-02, UC-03, UC-04 |
| `03-jd-search.spec.ts` | Tìm kiếm mô tả công việc | UC-17, UC-18 |
| `04-generate-cv.spec.ts` | Sinh CV bằng AI | UC-22 |
| `05-dashboard.spec.ts` | Bảng điều khiển Candidate | UC-12, UC-13, UC-14 |
| `06-admin.spec.ts` | Quản trị Admin | UC-19, UC-20b/c/d, UC-21c |

---

## 2. Kết quả kiểm tra sự khớp giữa test và luồng nghiệp vụ

### 2.1 Lỗi nghiêm trọng (test sai so với luồng thực tế)

#### LỖI 1 — `02-auth.spec.ts`: Test đăng ký trả về sai URL đích

| Hạng mục | Chi tiết |
|---|---|
| **Tệp** | `frontend/e2e/02-auth.spec.ts` |
| **Test cũ** | `"registers a candidate and lands on the candidate dashboard"` |
| **Kỳ vọng sai** | `toHaveURL('/dashboard/candidate')` sau khi đăng ký |
| **Luồng thực tế (UC-01)** | Sau khi đăng ký, `register/page.tsx` luôn gọi `router.push('/auth/verify-email?email=...')` |

**Phân tích nguyên nhân:**  
Hàm `register()` trong `AuthContext` chỉ gọi API và không xử lý token trả về (API trả về `{ message: string }`, không phải tokens). Trang đăng ký sau đó **luôn** chuyển hướng sang trang xác thực OTP (`/auth/verify-email`) bất kể kết quả API. Mock trong `helpers.ts` trả về tokens cho endpoint `/register` — điều này không phù hợp với hành vi thực của backend.

**Sửa đổi đã thực hiện:**
1. Cập nhật mock `mockAuthApi` để endpoint `POST /api/auth/register` trả về `{ message: string }` (đúng với đặc tả API thực tế).
2. Đổi tên test thành `"registers a candidate and redirects to email verification"`.
3. Thay assertion `toHaveURL('/dashboard/candidate')` bằng `toHaveURL(/\/auth\/verify-email\?email=newcandidate/)`.
4. Loại bỏ lời gọi `mockCandidateApis` không cần thiết trong test này.

---

#### LỖI 2 — `06-admin.spec.ts`: Test gọi tab "CV Library" không tồn tại

| Hạng mục | Chi tiết |
|---|---|
| **Tệp** | `frontend/e2e/06-admin.spec.ts` |
| **Test cũ** | `"edits CV metadata from the admin CV library tab"` |
| **Vấn đề** | Giao diện Admin không có tab "CV Library". Trang `dashboard/admin/page.tsx` chỉ có hai tab: **"Users"** và **"CV Templates"** |
| **Hệ quả** | Test sẽ fail ngay tại bước `page.getByRole('button', { name: 'CV Library' }).click()` vì phần tử không tồn tại |

**Các assertion sai khác trong cùng test:**
- `cvForm.getByLabel('CV Title')` — không có label "CV Title" trong form admin.
- `cvForm.getByRole('button', { name: 'Save CV Changes' })` — không có nút này; nút thực tế là **"Save Template"** (khi chỉnh sửa template).

**Sửa đổi đã thực hiện:**
1. Thay toàn bộ test bằng `"edits a CV template from the CV Templates tab"` (UC-21c), phản ánh đúng giao diện thực tế.
2. Thêm fixture dữ liệu `adminCvTemplates` và các route handler cho CRUD CV Templates vào `mockAdminApi`.
3. Test mới: click tab "CV Templates" → click "Edit" → sửa trường "Template Name" → click "Save Template" → kiểm tra tên mới xuất hiện.

---

### 2.2 Các test case còn thiếu (chưa có coverage)

#### THIẾU 1 — UC-02 nhánh phụ: Đăng nhập với email chưa xác thực

**Luồng (từ `login/page.tsx`):** Khi backend trả về lỗi chứa chuỗi `"not verified"`, trang đăng nhập chuyển hướng sang `/auth/verify-email?email=...` thay vì hiển thị thông báo lỗi thông thường.

**Test đã thêm:** `"redirects to OTP verification when the account email is not yet verified"`

```typescript
// Mô phỏng backend trả 403 với { detail: 'Email not verified...' }
// → Kiểm tra URL chuyển về /auth/verify-email?email=unverified...
await expect(page).toHaveURL(/\/auth\/verify-email\?email=unverified/)
```

---

#### THIẾU 2, 3 — UC-03: Xác thực OTP thành công và thất bại

**Trang `verify-email`** có tính năng tự động gửi khi người dùng điền đủ 6 ô số. Không có test nào kiểm tra luồng này.

**Tests đã thêm:**
1. `"verifies email with the correct OTP and proceeds to the candidate dashboard"` — Điền 6 chữ số, mock API trả token, kỳ vọng chuyển về `/dashboard/candidate`.
2. `"shows an error when an invalid OTP code is submitted"` — Điền mã sai, mock trả 400, kỳ vọng thông báo lỗi hiện và các ô số được reset về trống.

---

#### THIẾU 4 — UC-04: Gửi lại OTP

**Test đã thêm:** `"allows the user to resend the OTP and shows a cooldown timer"` — Click nút "Resend", kiểm tra nút bị vô hiệu hóa trong thời gian đếm ngược 60 giây.

---

#### THIẾU 5 — UC-13: Đặt CV làm CV chính

**Test đã thêm:** `"sets a secondary CV as the primary CV"` (trong `05-dashboard.spec.ts`)

Luồng: Click "Set Primary" trên "Platform Engineer CV" (không phải CV mặc định) → Gọi `PATCH /api/cv-docs/202/primary` → Kiểm tra badge "Primary" xuất hiện kế tiêu đề "Platform Engineer CV" và biến mất khỏi "Java Backend CV".

```typescript
const platformCvTitle = page.getByRole('heading', { name: 'Platform Engineer CV' })
await expect(platformCvTitle.locator('..').getByText('Primary')).toBeVisible()
```

---

#### THIẾU 6 — UC-14: Xóa CV

**Test đã thêm:** `"deletes a CV after confirming the deletion modal"` (trong `05-dashboard.spec.ts`)

Luồng: Click "Delete" → Modal xác nhận hiện lên với tiêu đề "Delete CV" → Click xác nhận → Kiểm tra toast "CV deleted successfully" và CV đã biến khỏi danh sách.

---

#### THIẾU 7 — UC-20c: Cập nhật thông tin người dùng (Admin)

**Test đã thêm:** `"updates user information from the admin panel"` (trong `06-admin.spec.ts`)

Luồng: Click "Edit" trên hàng người dùng → Form điền sẵn thông tin → Sửa "Full Name" → Click "Update User" → Kiểm tra tên mới trong danh sách.

---

#### THIẾU 8 — UC-20d: Xóa người dùng (Admin)

**Test đã thêm:** `"deletes a user after confirming the admin confirmation modal"` (trong `06-admin.spec.ts`)

Lưu ý quan trọng: Modal xác nhận trong trang admin sử dụng nhãn button được hardcode bằng tiếng Việt (`"Xác nhận"`) bất kể ngôn ngữ giao diện. Test được viết phù hợp với hành vi này.

---

## 3. Thay đổi trong `helpers.ts`

| Thay đổi | Lý do |
|---|---|
| Thêm kiểu `CvTemplate` | Cần cho fixture template admin |
| Thêm fixture `adminCvTemplates` | Dữ liệu mẫu cho 2 template (Classic, Modern) |
| Sửa mock `POST /api/auth/register` | Trả về `{ message: string }` thay vì tokens — khớp với đặc tả API thực tế |
| Thêm hàm `mockOtpApi()` | Mock cho UC-03/04: `POST /auth/verify-email` và `POST /auth/resend-verification` |
| Thêm tham số `templates?` vào `mockAdminApi` | Hỗ trợ inject dữ liệu template tùy chỉnh |
| Thêm route handlers cho CRUD templates trong `mockAdminApi` | Xử lý `GET/POST/PUT/DELETE /api/admin/cv-templates` |

---

## 4. Tổng hợp thay đổi theo tệp

| Tệp | Loại thay đổi | Số lượng test |
|---|---|---|
| `helpers.ts` | Sửa mock, thêm fixture, thêm hàm | — |
| `01-landing.spec.ts` | Không thay đổi (đúng) | 3 ✅ |
| `02-auth.spec.ts` | Sửa 1 test, thêm 4 test mới | 4 → **8** |
| `03-jd-search.spec.ts` | Không thay đổi (đúng) | 3 ✅ |
| `04-generate-cv.spec.ts` | Không thay đổi (đúng) | 2 ✅ |
| `05-dashboard.spec.ts` | Thêm 2 test mới | 3 → **5** |
| `06-admin.spec.ts` | Sửa 1 test, thêm 2 test mới | 3 → **5** |
| **Tổng** | | **15 → 26** |

---

## 5. Ma trận bao phủ Use Case sau khi sửa

| Use Case | Mô tả | Trạng thái |
|---|---|---|
| UC-01 | Đăng ký tài khoản | ✅ Đã có (đã sửa) |
| UC-02 | Đăng nhập | ✅ Đầy đủ (thêm nhánh email chưa xác thực) |
| UC-03 | Xác thực Email (OTP) | ✅ Mới thêm |
| UC-04 | Gửi lại mã OTP | ✅ Mới thêm |
| UC-05 | Quên mật khẩu | ⬜ Chưa có test |
| UC-06 | Đặt lại mật khẩu | ⬜ Chưa có test |
| UC-07 | Đổi mật khẩu | ⬜ Chưa có test |
| UC-09 | Xem hồ sơ cá nhân | ✅ Đã có |
| UC-12 | Xem thư viện CV | ✅ Đã có |
| UC-13 | Đặt CV làm CV chính | ✅ Mới thêm |
| UC-14 | Xóa CV | ✅ Mới thêm |
| UC-17 | Tìm kiếm mô tả công việc | ✅ Đã có |
| UC-18 | Xem chi tiết JD | ✅ Đã có |
| UC-19 | Xem Dashboard quản trị | ✅ Đã có |
| UC-20b | Tạo người dùng mới (Admin) | ✅ Đã có |
| UC-20c | Cập nhật người dùng (Admin) | ✅ Mới thêm |
| UC-20d | Xóa người dùng (Admin) | ✅ Mới thêm |
| UC-21c | Cập nhật Template CV (Admin) | ✅ Đã sửa (trước đây test sai UI) |
| UC-22 | Sinh CV bằng AI | ✅ Đã có |

> **Ghi chú:** UC-05, UC-06, UC-07, UC-08, UC-10, UC-11, UC-15, UC-16, UC-20a, UC-21a/b/d, UC-23–UC-29 chưa được kiểm thử E2E (phần lớn là luồng backend/AI pipeline hoặc trang chưa render hoàn chỉnh trong môi trường test).

---

## 6. Lưu ý kỹ thuật

### 6.1 Cơ chế auto-submit OTP
Trang `verify-email` tự động gửi mã khi người dùng điền đủ 6 ô số (không cần nhấn nút Submit). Trong Playwright, mỗi lần gọi `inputs.nth(i).fill(digit)` đều kích hoạt sự kiện `onChange`, và khi ô cuối cùng (index 5) được điền, hàm `submitOtp()` được gọi tự động.

```typescript
// Helper dùng trong test OTP
async function fillOtpInputs(page, code) {
  const inputs = page.locator('input[inputmode="numeric"]')
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(code[i])
  }
}
```

### 6.2 Modal xác nhận Admin dùng text tiếng Việt cố định
Component `ConfirmModal` trong `dashboard/admin/page.tsx` hardcode nhãn nút là `"Xác nhận"` và `"Hủy"` không thông qua hệ thống i18n. Đây là điểm cần lưu ý khi viết test cho trang Admin.

### 6.3 Sắp xếp thẻ CV theo mặc định
Dashboard candidate mặc định sắp xếp CV theo `newest` (mới nhất trước). Với dữ liệu fixture:
- `Platform Engineer CV` (`createdAt: 3 ngày trước`) → Thẻ đầu tiên
- `Java Backend CV` (`createdAt: 10 ngày trước`) → Thẻ thứ hai

Điều này ảnh hưởng đến selector `.first()` trong các test Delete/SetPrimary.

---

*Báo cáo được tạo từ kết quả phân tích đối chiếu giữa tệp `activity_diagrams.md` và mã nguồn frontend (`frontend/e2e/`, `frontend/src/app/`) của dự án CVCraft.*
