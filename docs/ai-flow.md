# Luồng Xử Lý AI

Tài liệu này mô tả đường đi dữ liệu từ FE tới BE và các bước AI trong CVCraft.

## 1. JD Search Flow

Mục tiêu: người dùng nhập vị trí/kỹ năng mong muốn, hệ thống trả về các JD phù hợp và định dạng lại các mục mô tả công việc, yêu cầu, quyền lợi.

```text
Frontend
  |
  v
POST /api/jd/search
  |
  v
Next.js proxy route
  |
  v
jd-search FastAPI: POST /v1/jd/search
  |
  v
JDSearchService.search()
  |
  +--> Embed query
  +--> Query JDVectorStore / ChromaDB
  +--> Score theo semantic similarity và title match
  +--> Lọc top results
  +--> LLM format lại job_description / requirements / benefits
  |
  v
JDSearchResponse
```

File chính:

```text
frontend/src/app/api/jd/search/route.ts
jd-search/src/jd_search/api/v1/jd.py
jd-search/src/jd_search/services/jd_search_service.py
jd-search/src/jd_search/rag/vector_store.py
```

## 2. Generate CV Flow

Mục tiêu: người dùng chọn/nhập JD và profile, hệ thống sinh CV draft, chấm điểm chất lượng, sửa lại nếu cần và render ra file `.docx` khi có template.

```text
Frontend
  |
  v
POST /api/cv/generate
  |
  v
Next.js proxy route
  |
  v
generate-cv FastAPI: POST /v1/cv/generate
  |
  v
CVService.generate_cv()
  |
  v
LangGraph pipeline
```

LangGraph pipeline:

```text
START
  |
  +--> jd_analyzer --------+
  |                        |
  +--> user_profile -------+
                           |
                           v
                    summary_agent
                           |
                           v
                  experience_agent
                           |
                           v
                     skills_agent
                           |
                           v
                       qc_agent
                           |
             +-------------+-------------+
             |                           |
             v                           v
  overall thấp và còn lượt sửa     đạt yêu cầu
             |                           |
             v                           v
      summary_agent loop       template_renderer hoặc END
```

File chính:

```text
frontend/src/app/api/cv/generate/route.ts
generate-cv/src/generate_cv/api/v1/cv.py
generate-cv/src/generate_cv/services/cv_service.py
generate-cv/src/generate_cv/pipeline/graph.py
generate-cv/src/generate_cv/agents/
```

## 3. Vai Trò Các Agent

| Agent | Nhiệm vụ |
|---|---|
| `jd_analyzer` | Phân tích JD thành role, seniority, required skills, keywords |
| `user_profile` | Chuẩn hóa input người dùng thành profile có cấu trúc |
| `summary_agent` | Viết professional summary, có thể dùng RAG examples |
| `experience_agent` | Viết lại bullet points kinh nghiệm theo JD |
| `skills_agent` | Phân nhóm kỹ năng phù hợp với JD |
| `qc_agent` | Chấm điểm ATS, JD match, linguistic quality |
| `template_renderer` | Render kết quả vào template `.docx` |

## 4. RAG Và LLM

Hai backend service đều có phần RAG riêng:

| Service | RAG dùng cho |
|---|---|
| `jd-search` | Tìm JD bằng embedding và ChromaDB |
| `generate-cv` | Lấy ví dụ CV tốt để hỗ trợ agent viết summary/bullets |

LLM được gọi ở các điểm chính:

```text
jd-search:
  - Format JD sections thành bullet sạch, dễ hiển thị

generate-cv:
  - Phân tích JD
  - Sinh summary
  - Sinh experience bullets
  - Phân loại skills
  - Chấm điểm QC
```

## 5. Contract FE-BE

FE giữ type ở:

```text
frontend/src/lib/types.ts
```

Backend trả response chính:

```text
JDSearchResponse
GenerateCVResponse
QualityScore
```

Khi thay đổi schema backend, cần cập nhật `frontend/src/lib/types.ts` để UI không lệch contract.
