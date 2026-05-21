# CVCraft Backend — Java Spring Boot

REST API cho CVCraft. Quản lý xác thực, profile CV cá nhân và thư viện CV của người dùng.

> **Lưu ý:** Backend Java chỉ xử lý Auth + Profile + CV Library. Toàn bộ tính năng AI tạo CV chạy trên Python FastAPI (port 8000).

## Tech Stack

- **Java 21** + Spring Boot 3.2
- **Spring Security 6** với JWT (jjwt)
- **Spring Data JPA** + PostgreSQL
- **Flyway** — database migrations
- **SpringDoc OpenAPI** — Swagger UI
- **Lombok**

## Yêu cầu

- Java 21+
- Maven 3.9+
- PostgreSQL 15+

## Cài đặt

### 1. Tạo database

```sql
CREATE DATABASE cvcraft_db;
```

### 2. Cấu hình biến môi trường

```bash
export DB_URL=jdbc:postgresql://localhost:5432/cvcraft_db
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret_min_32_chars
export JWT_EXPIRATION=3600000
```

Hoặc đặt trong `src/main/resources/application.yml`.

### 3. Chạy

```bash
mvn spring-boot:run
```

Server khởi động tại **http://localhost:8080/api**

Swagger UI: http://localhost:8080/api/swagger-ui.html

## Migrations Flyway

| Version | Nội dung |
|---------|----------|
| V1 | Schema ban đầu (users, candidate_profiles) |
| V2 | Fix admin password |
| V3 | Bảng `cv_documents` (CV library), cập nhật role constraint |

## API Endpoints

### Auth

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/auth/register` | Public | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | Public | Đăng nhập, nhận JWT |
| `POST` | `/auth/refresh` | Public | Làm mới access token |

### Profile

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET`  | `/profile` | JWT | Xem profile CV của mình |
| `PUT`  | `/profile` | JWT | Cập nhật profile (kỹ năng, kinh nghiệm, links...) |

### CV Library (`/cv-docs`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET`  | `/cv-docs` | JWT | Danh sách CV đã lưu (phân trang) |
| `POST` | `/cv-docs` | JWT | Lưu CV mới vào thư viện |
| `PATCH`| `/cv-docs/{id}/primary` | JWT | Đánh dấu làm CV chính |
| `DELETE`| `/cv-docs/{id}` | JWT | Xóa CV khỏi thư viện |
| `GET`  | `/cv-docs/stats` | JWT | Thống kê (tổng số CV) |

## Data Models

### User

```
id, email, password, fullName, phone
role: CANDIDATE | ADMIN
isActive, isEmailVerified
createdAt, updatedAt
```

### CandidateProfile (profile CV cá nhân)

```
id, userId
headline, bio, location
experienceYears, experienceLevel (INTERN/JUNIOR/MID/SENIOR/LEAD/MANAGER/DIRECTOR)
skills[]
cvUrl, linkedinUrl, githubUrl, portfolioUrl
workExperiences (JSONB), educations (JSONB), certifications (JSONB)
createdAt, updatedAt
```

### CvDocument (thư viện CV)

```
id, userId
title, templateId
fileName, downloadUrl
atsScore, jdTitle, jdText
isPrimary
createdAt, updatedAt
```

## Tính năng

- **JWT Authentication** với access + refresh token
- **Profile CV** — lưu thông tin cá nhân để tái sử dụng khi tạo CV
- **CV Library** — lưu nhiều phiên bản CV, đánh dấu CV chính
- **Database migrations** tự động qua Flyway
- **OpenAPI docs** qua SpringDoc
