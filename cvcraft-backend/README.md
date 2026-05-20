# CVCraft Backend — Java Spring Boot

REST API for CVCraft recruitment platform. Handles authentication, job posts, candidate profiles, applications, bookmarks, and company management.

## Tech Stack
- **Java 21** + Spring Boot 3.2
- **Spring Security 6** with JWT (jjwt)
- **Spring Data JPA** + PostgreSQL
- **Flyway** — database migrations
- **Caffeine** — in-memory caching
- **SpringDoc OpenAPI** — Swagger UI
- **Lombok** + MapStruct

## Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL 15+

## Setup

### 1. Create database
```sql
CREATE DATABASE cvcraft_db;
```

### 2. Configure environment
```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret_min_32_chars
```
Or set them in `application.yml`.

### 3. Run
```bash
mvn spring-boot:run
```

The server starts at **http://localhost:8080/api**

## API Documentation
Swagger UI: http://localhost:8080/api/swagger-ui.html

## Key API Endpoints

| Method | Endpoint                          | Auth     | Description                     |
|--------|-----------------------------------|----------|---------------------------------|
| POST   | /auth/register                    | Public   | Register candidate/recruiter    |
| POST   | /auth/login                       | Public   | Login, get JWT tokens           |
| GET    | /jobs                             | Public   | Search & filter jobs            |
| GET    | /jobs/{id}                        | Public   | Get job detail                  |
| POST   | /jobs                             | RECRUITER| Create job post                 |
| GET    | /candidates                       | Public   | Browse candidates               |
| GET    | /candidates/{id}                  | Public   | Get candidate profile           |
| PUT    | /candidates/me                    | CANDIDATE| Update my profile               |
| POST   | /applications/jobs/{jobId}        | CANDIDATE| Apply to job                    |
| GET    | /applications/my                  | AUTH     | My applications                 |
| PATCH  | /applications/{id}/status         | RECRUITER| Update application status       |
| POST   | /bookmarks/jobs/{jobId}           | AUTH     | Bookmark job                    |
| POST   | /bookmarks/candidates/{id}        | AUTH     | Shortlist candidate             |
| GET    | /companies                        | Public   | Search companies                |
| POST   | /companies                        | RECRUITER| Create company                  |

## Features
- **JWT Authentication** with access + refresh tokens
- **Role-based access control** (CANDIDATE / RECRUITER / ADMIN)
- **Full-text job search** with filters (location, type, level, salary, work mode)
- **Candidate browsing & filtering** (skills, experience, open-to-work status)
- **Application lifecycle tracking** (PENDING → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED → HIRED / REJECTED)
- **Bookmark system** for jobs (candidates) and candidate shortlisting (recruiters)
- **Company management** with verified badge
- **View count tracking** for jobs and profiles
- **Pagination** on all list endpoints
- **Database migrations** via Flyway
- **OpenAPI docs** via SpringDoc
