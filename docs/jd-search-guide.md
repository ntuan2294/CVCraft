# Hướng dẫn: RAG Job Description Search

Tính năng tìm kiếm JD theo ngữ nghĩa — người dùng nhập keyword hoặc mô tả mong muốn, hệ thống tìm Top-K JD liên quan và dùng LLM gợi ý skills, keywords CV, project phù hợp.

---

## Tổng quan luồng hoạt động

```
Người dùng nhập query
        │
        ▼
Embedding query (text-embedding-3-small)
        │
        ▼
ChromaDB tìm Top-K JD tương đồng nhất
        │
        ▼
gpt-4o-mini phân tích Top-K JD
        │
        ▼
Trả về: Top JDs + gợi ý skills / keywords / projects
```

---

## Yêu cầu trước khi chạy

- Python 3.11+
- `OPENAI_API_KEY` đã set trong file `.env`
- Dependencies đã cài: `pip install -e ".[api]"`
- **Kết nối internet** (lần đầu để download dataset từ HuggingFace)

---

## Bước 1 — Build JD Index

> Chỉ cần chạy **một lần**. Index lưu lại tại `data/vectordb/`, lần sau không cần chạy lại.

### Chạy nhanh để test (khuyến nghị lần đầu)

```powershell
python -m cvcraft.rag.jd_indexer --target 500 --max-scan 10000
```

| Tham số | Ý nghĩa | Mặc định |
|---|---|---|
| `--target` | Số JD muốn index vào DB | 3000 |
| `--max-scan` | Số record HuggingFace quét qua để lọc | 50000 |
| `--reset` | Xóa index cũ và build lại | False |
| `--dry-run` | Test loader, không ghi vào DB | False |

### Chạy đầy đủ (cho production / khóa luận)

```powershell
python -m cvcraft.rag.jd_indexer --target 3000 --max-scan 50000
```

### Output mẫu khi thành công

```
======================================================================
CVCraft - JD Indexer (tinixai/vietnamese-job-descriptions)
======================================================================

[1/3] Load JD từ HuggingFace...
Đang stream dataset 'tinixai/vietnamese-job-descriptions'...
  Scanned 5,000 | Parsed 3,812
  Scanned 10,000 | Parsed 7,490
Scanned 10,000 records → 7,490 hợp lệ
Stratified sample: 500 JDs (8 industries)
  Industries: {'tech': 120, 'sales': 80, 'finance': 70, 'other': 65, ...}
  Seniorities: {'mid': 210, 'junior': 180, 'senior': 110}

[2/3] Chuẩn bị batch (500 JDs)...

[3/3] Reset collection và upsert vào ChromaDB...
  Indexed 500/500...

======================================================================
HOÀN TẤT — Indexed 500 job descriptions.
======================================================================
```

> **Thời gian ước tính:**
> - `--target 500`: ~5–8 phút
> - `--target 3000`: ~20–30 phút (do gọi OpenAI Embedding API)

---

## Bước 2 — Test qua CLI

Sau khi index xong, dùng lệnh `jd-search`:

```powershell
cvcraft jd-search "backend python 3 năm kinh nghiệm"
```

### Các ví dụ query

```powershell
# Tìm theo mô tả công việc
cvcraft jd-search "lập trình web fullstack react nodejs"

# Lọc theo ngành và cấp độ
cvcraft jd-search "phân tích dữ liệu sql" --industry finance --seniority mid

# Lấy nhiều JD hơn
cvcraft jd-search "devops kubernetes aws" --top-k 8

# Kết hợp nhiều lọc
cvcraft jd-search "thiết kế ux figma" --industry design --seniority junior --top-k 3
```

### Tùy chọn lệnh

| Tùy chọn | Ý nghĩa | Mặc định |
|---|---|---|
| `--top-k` | Số JD trả về | 5 |
| `--industry` | Lọc ngành: `tech`, `finance`, `marketing`, `sales`, `design`, `hr`, `product`, `engineering`, `education`, `healthcare` | Không lọc |
| `--seniority` | Lọc cấp độ: `junior`, `mid`, `senior` | Không lọc |

### Output mẫu

```
Searching for: "backend python 3 năm kinh nghiệm"

======================================================================
  TOP MATCHING JOB DESCRIPTIONS
======================================================================
  1. Lập trình viên Backend Python (mid) | TechVN Corp | score: 0.872
     Skills: Python, Django, PostgreSQL, Redis, Docker
  2. Python Backend Developer (mid) | CloudBase | score: 0.854
     Skills: Python, FastAPI, MySQL, AWS, Git
  3. Backend Engineer (senior) | StartupXYZ | score: 0.831
     Skills: Python, Microservices, Kafka, Kubernetes
  4. Software Engineer Backend (mid) | DataSoft | score: 0.809
     Skills: Python, Flask, MongoDB, Docker, CI/CD
  5. Junior Python Developer (junior) | AppForge | score: 0.788
     Skills: Python, REST API, PostgreSQL, Git

======================================================================
  GỢI Ý TỪ AI
======================================================================

  Skills cần phát triển:
    - Kubernetes và container orchestration
    - Apache Kafka (message queue)
    - System Design cho distributed systems
    - AWS hoặc GCP (cloud provider)

  Keywords ATS nên thêm vào CV:
    - microservices architecture
    - RESTful API design
    - CI/CD pipeline
    - unit testing / pytest
    - agile / scrum

  Project nên xây dựng / showcase:
    - REST API với JWT authentication và rate limiting
    - Microservice nhỏ deploy trên Docker + Kubernetes
    - ETL pipeline xử lý dữ liệu thực tế

  Gợi ý viết Summary:
    Nêu rõ số năm kinh nghiệm, scale hệ thống đã xây dựng (số user,
    số request/day), và công nghệ chủ lực. Ví dụ: "Backend engineer
    với 3 năm kinh nghiệm xây dựng REST API phục vụ 500K user dùng
    Python/FastAPI và PostgreSQL, deploy trên AWS."
```

---

## Bước 3 — Test qua API (tùy chọn)

### Khởi động server

```powershell
uvicorn cvcraft.api.main:app --reload --port 8000
```

### Swagger UI

Mở trình duyệt: **http://localhost:8000/docs**

Tìm mục **jd-search** → `POST /v1/jd/search` → **Try it out**.

### Gọi API thủ công

**Tìm kiếm JD:**
```powershell
curl -X POST http://localhost:8000/v1/jd/search `
  -H "Content-Type: application/json" `
  -d '{"query": "backend python 3 nam kinh nghiem", "top_k": 5}'
```

**Kiểm tra số lượng JD đã index:**
```powershell
curl http://localhost:8000/v1/jd/stats
```

**Index thêm 1 JD tùy chỉnh:**
```powershell
curl -X POST http://localhost:8000/v1/jd/index `
  -H "Content-Type: application/json" `
  -d '{
    "jd": {
      "id": "custom_jd_001",
      "title": "Python Developer",
      "company": "My Company",
      "industry": "tech",
      "seniority": "mid",
      "description": "Chúng tôi tìm Python Developer...",
      "required_skills": ["Python", "FastAPI", "PostgreSQL"],
      "keywords": ["python", "backend", "api"]
    }
  }'
```

### Response mẫu (`/v1/jd/search`)

```json
{
  "query": "backend python 3 năm kinh nghiệm",
  "top_jds": [
    {
      "jd": {
        "id": "jd_hf_1234",
        "title": "Lập trình viên Backend Python",
        "company": "TechVN Corp",
        "industry": "tech",
        "seniority": "mid",
        "description": "...",
        "required_skills": ["Python", "Django", "PostgreSQL"],
        "keywords": ["python", "backend", "django"]
      },
      "similarity_score": 0.872
    }
  ],
  "suggestion": {
    "skills_to_develop": ["Kubernetes", "Kafka", "System Design"],
    "cv_keywords": ["microservices", "RESTful API", "CI/CD"],
    "recommended_projects": ["REST API với JWT", "Microservice trên Docker"],
    "summary_tips": "Nêu rõ số năm kinh nghiệm và scale hệ thống..."
  }
}
```

---

## Xử lý sự cố

### Lỗi: `InternalError: Error loading hnsw index`

Xảy ra khi collection rỗng hoặc bị corrupt (chạy search trước khi index).

```powershell
# Xóa DB cũ
Remove-Item -Recurse -Force data\vectordb

# Build lại index
python -m cvcraft.rag.jd_indexer --target 500 --max-scan 10000
```

### Lỗi: `OPENAI_API_KEY chưa được set`

```powershell
# Kiểm tra file .env
cat .env

# Đảm bảo có dòng:
# OPENAI_API_KEY=sk-...
```

### Muốn re-index lại từ đầu

```powershell
python -m cvcraft.rag.jd_indexer --reset --target 500 --max-scan 10000
```

### Kiểm tra index đã có data chưa (không cần API)

```powershell
python -c "
from dotenv import load_dotenv; load_dotenv()
from cvcraft.services.jd_search_service import JDSearchService
print(JDSearchService().get_stats())
"
```

---

## Dataset

| Thông tin | Chi tiết |
|---|---|
| Nguồn | [tinixai/vietnamese-job-descriptions](https://huggingface.co/datasets/tinixai/vietnamese-job-descriptions) |
| Tổng records | ~607.000 JD tiếng Việt |
| Thời gian | 2022–2026 |
| License | CC-BY-NC-4.0 |

**Mapping tự động:**

| Field HuggingFace | Xử lý |
|---|---|
| `experience_level` + `job_position` | Map → `junior / mid / senior` |
| `job_industry` | Map → `tech / finance / marketing / ...` |
| `job_description` + `requirements` | Ghép thành `description` |
| `requirements` | Tách dòng → `required_skills` |

---

## Files liên quan

| File | Vai trò |
|---|---|
| [src/cvcraft/rag/hf_jd_loader.py](../src/cvcraft/rag/hf_jd_loader.py) | Load + parse dataset HuggingFace |
| [src/cvcraft/rag/jd_indexer.py](../src/cvcraft/rag/jd_indexer.py) | Index JDs vào ChromaDB |
| [src/cvcraft/rag/vector_store.py](../src/cvcraft/rag/vector_store.py) | ChromaDB wrapper (collection `job_descriptions`) |
| [src/cvcraft/agents/jd_suggestion_agent.py](../src/cvcraft/agents/jd_suggestion_agent.py) | LLM agent phân tích JD → gợi ý |
| [src/cvcraft/services/jd_search_service.py](../src/cvcraft/services/jd_search_service.py) | Service layer orchestration |
| [src/cvcraft/api/v1/jd.py](../src/cvcraft/api/v1/jd.py) | FastAPI endpoints |
| [src/cvcraft/core/jd_search_models.py](../src/cvcraft/core/jd_search_models.py) | Pydantic models |
