"""
POST /v1/cv/extract-jd  — Extract and structure JD text from an uploaded file.

All formats (PDF, DOCX, PNG, JPG) go through AI to produce structured sections:
Công ty, Vị trí, Mô tả công việc, Yêu cầu công việc, Phúc lợi.
"""
import base64
import io
import os

from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter()

_ALLOWED_EXT = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}
_ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
}

_JD_STRUCTURE_SYSTEM = """You are a job description parser. Given raw text from a job posting, extract and return structured information in Vietnamese labels.

Output format (use EXACTLY these headers, keep original content language for body text):

**Công ty:** [Company name, or "Không rõ" if missing]
**Vị trí:** [Job title/position]

**Mô tả công việc:**
[Job overview / responsibilities — preserve bullet points if present]

**Yêu cầu công việc:**
[Requirements — preserve bullet points. Include skills, experience, education, etc.]

**Phúc lợi:**
[Benefits / perks, or "Không đề cập" if not listed]

Rules:
- Keep the original language for body content (Vietnamese stays Vietnamese, English stays English)
- If a section is missing from the source, write "Không đề cập"
- Do not add content that is not in the source
- Return ONLY the structured text, no preamble"""

_IMAGE_EXTRACT_PROMPT = """Extract ALL text from this job description image exactly as it appears.
Preserve the structure (headings, bullet points, line breaks). Return only the raw text."""

_IMAGE_STRUCTURE_SYSTEM = """You are a job description parser. Given an image of a job posting, extract and return structured information in Vietnamese labels.

Output format (use EXACTLY these headers):

**Công ty:** [Company name, or "Không rõ" if missing]
**Vị trí:** [Job title/position]

**Mô tả công việc:**
[Job overview / responsibilities]

**Yêu cầu công việc:**
[Requirements — skills, experience, education, etc.]

**Phúc lợi:**
[Benefits / perks, or "Không đề cập" if not listed]

Rules:
- Keep the original language for body content
- If a section is missing, write "Không đề cập"
- Return ONLY the structured text, no preamble"""


def _ext(filename: str) -> str:
    from pathlib import Path
    return Path(filename).suffix.lower()


def _get_openai():
    from openai import OpenAI
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY chưa được cấu hình")
    return OpenAI(api_key=api_key)


def _extract_pdf(data: bytes) -> str:
    import fitz  # pymupdf — already in project dependencies
    doc = fitz.open(stream=data, filetype="pdf")
    parts = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(p for p in parts if p.strip())


def _extract_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _structure_text_with_llm(raw_text: str) -> str:
    client = _get_openai()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=2048,
        messages=[
            {"role": "system", "content": _JD_STRUCTURE_SYSTEM},
            {"role": "user", "content": raw_text},
        ],
    )
    return resp.choices[0].message.content or raw_text


def _extract_and_structure_image(data: bytes, mime: str) -> str:
    b64 = base64.b64encode(data).decode()
    client = _get_openai()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=2048,
        messages=[
            {"role": "system", "content": _IMAGE_STRUCTURE_SYSTEM},
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                    {"type": "text", "text": "Extract and structure this job description image."},
                ],
            },
        ],
    )
    return resp.choices[0].message.content or ""


@router.post("/extract-jd")
async def extract_jd(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = _ext(filename)
    mime = (file.content_type or "").split(";")[0].strip().lower()

    if ext not in _ALLOWED_EXT and mime not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Định dạng không được hỗ trợ: {ext or mime}. Chỉ chấp nhận PDF, DOCX, PNG, JPG.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File trống")

    try:
        if mime.startswith("image/") or ext in {".png", ".jpg", ".jpeg"}:
            text = _extract_and_structure_image(data, mime or "image/png")
        elif ext == ".pdf" or mime == "application/pdf":
            raw = _extract_pdf(data)
            if not raw.strip():
                raise HTTPException(status_code=422, detail="PDF không chứa văn bản (ảnh scan). Vui lòng dùng file ảnh.")
            text = _structure_text_with_llm(raw)
        else:
            raw = _extract_docx(data)
            text = _structure_text_with_llm(raw)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không đọc được file: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="Không tìm thấy văn bản trong file")

    return {"text": text.strip()}
