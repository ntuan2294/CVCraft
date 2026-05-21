# Luồng Xử Lý AI — CVCraft

CVCraft có hai luồng AI chính: **Tạo CV** và **Tìm kiếm JD**.  
Cả hai đều được dùng phối hợp — người dùng tìm JD phù hợp, rồi dùng nó để tạo CV được cá nhân hóa.

---

## 1. JD Search Flow

**Mục tiêu:** Người dùng nhập vị trí/kỹ năng, hệ thống trả về các JD phù hợp (đã format sạch), dùng làm đầu vào cho quá trình tạo CV.

```
Frontend
  │
  ▼
POST /api/jd/search   (Next.js proxy route)
  │
  ▼
Python FastAPI: POST /v1/jd/search
  │
  ▼
JDSearchService.search()
  │
  ├── Embed query (OpenAI text-embedding)
  ├── Query ChromaDB → semantic similarity search
  ├── Score và lọc top results
  └── LLM format lại: job_description / requirements / benefits → bullet points
  │
  ▼
JDSearchResponse { top_jds: [...] }
```

**Files liên quan:**

```
frontend/src/app/api/jd/search/route.ts
backend/src/cvcraft/jd_search/api/v1/jd.py
backend/src/cvcraft/jd_search/services/jd_search_service.py
backend/src/cvcraft/jd_search/rag/vector_store.py
```

---

## 2. Generate CV Flow

**Mục tiêu:** Người dùng nhập thông tin cá nhân + JD, hệ thống sinh CV draft, chấm điểm chất lượng, sửa lại nếu cần, và render ra file `.docx`.

```
Frontend
  │
  ▼
POST /api/cv/generate   (Next.js proxy route)
  │
  ▼
Python FastAPI: POST /v1/cv/generate
  │
  ▼
CVService.generate_cv()
  │
  ▼
LangGraph Pipeline (6 agents)
```

### LangGraph Pipeline

```
START
  │
  ├──► jd_analyzer ──────────────┐
  │                              │
  └──► user_profile ─────────────┤
                                 │
                                 ▼
                          summary_agent    ◄── RAG (ví dụ CV tốt)
                                 │
                                 ▼
                        experience_agent  ◄── RAG
                                 │
                                 ▼
                           skills_agent
                                 │
                                 ▼
                             qc_agent
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
              Điểm thấp &               Điểm đủ cao
              còn lượt sửa                    │
                    │                          ▼
                    └──► summary_agent   template_renderer
                         (loop cải thiện)      │
                                               ▼
                                         .docx output
```

**Files liên quan:**

```
frontend/src/app/api/cv/generate/route.ts
backend/src/cvcraft/generate_cv/api/v1/cv.py
backend/src/cvcraft/generate_cv/services/cv_service.py
backend/src/cvcraft/generate_cv/pipeline/graph.py
backend/src/cvcraft/generate_cv/agents/
```

---

## 3. Vai Trò Các Agent

| Agent | Nhiệm vụ |
|-------|---------|
| `jd_analyzer` | Phân tích JD → role, seniority, required skills, keywords |
| `user_profile` | Chuẩn hóa input người dùng thành profile có cấu trúc |
| `summary_agent` | Viết professional summary, có dùng RAG examples |
| `experience_agent` | Viết lại bullet points kinh nghiệm theo JD |
| `skills_agent` | Phân nhóm và ưu tiên kỹ năng phù hợp với JD |
| `qc_agent` | Chấm điểm ATS score, JD match, linguistic quality |
| `template_renderer` | Render kết quả cuối vào template `.docx` |

---

## 4. RAG và LLM

### RAG

| Service | RAG dùng cho |
|---------|-------------|
| `jd_search` | Tìm JD bằng embedding + ChromaDB |
| `generate_cv` | Lấy ví dụ CV tốt để hỗ trợ agent viết summary/bullets |

### LLM được gọi tại

```
jd_search:
  - Format JD sections thành bullet sạch

generate_cv:
  - jd_analyzer:        phân tích JD
  - summary_agent:      sinh professional summary
  - experience_agent:   sinh experience bullets
  - skills_agent:       phân loại skills
  - qc_agent:           chấm điểm quality
```

---

## 5. Luồng Lưu CV vào Thư Viện

Sau khi tạo CV xong, người dùng có thể lưu vào thư viện (Java backend):

```
Frontend nhận GenerateCVResponse
  │
  ├── downloadUrl (link tải .docx từ Python service)
  ├── atsScore (từ qc_agent)
  └── Người dùng click "Save to Library"
          │
          ▼
   POST /api/cv-docs  (Java Spring Boot)
   Body: { title, templateId, fileName, downloadUrl, atsScore, jdTitle }
          │
          ▼
   CvDocument được lưu vào PostgreSQL
          │
          ▼
   Hiển thị trong /dashboard → tab "My CVs"
```

---

## 6. Contract FE–BE

Type definitions FE tại:

```
frontend/src/lib/types.ts
```

Responses chính từ Python AI:

```typescript
GenerateCVResponse   // kết quả tạo CV
QualityScore         // điểm ATS / JD match / linguistic
JDSearchResponse     // kết quả tìm JD
```

Responses từ Java backend:

```typescript
AuthResponse         // JWT tokens + user info
UserProfile          // profile CV cá nhân
CvDocument           // CV đã lưu trong thư viện
PageResponse<T>      // danh sách phân trang
```

> Khi thay đổi schema backend, cần cập nhật `frontend/src/lib/types.ts` để UI không lệch contract.
