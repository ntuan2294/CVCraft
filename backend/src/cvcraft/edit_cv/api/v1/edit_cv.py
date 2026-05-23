"""
POST /v1/edit-cv/analyze  — Analyze a CV against a JD.

Accepts multipart form:
  - cv_file : UploadFile  (PDF, DOCX, PNG, JPG)
  - jd_text : str         (structured JD text from the JD panel)

Returns:
  { evaluation, suggestions, score }
"""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from cvcraft.edit_cv.services.edit_cv_service import EditCVService

router = APIRouter()

_ALLOWED_EXT = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}


@router.post("/analyze")
async def analyze_cv_endpoint(
    cv_file: UploadFile = File(...),
    jd_text: str = Form(...),
):
    from pathlib import Path

    filename = cv_file.filename or ""
    ext = Path(filename).suffix.lower()
    mime = (cv_file.content_type or "").split(";")[0].strip().lower()

    if ext not in _ALLOWED_EXT and not mime.startswith("image/") and "pdf" not in mime and "word" not in mime:
        raise HTTPException(
            status_code=415,
            detail=f"Định dạng CV không được hỗ trợ: {ext or mime}. Chỉ chấp nhận PDF, DOCX, PNG, JPG.",
        )

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập hoặc tải JD trước khi phân tích")

    data = await cv_file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File CV trống")

    try:
        service = EditCVService()
        result = service.run(
            cv_data=data,
            cv_mime=mime,
            cv_filename=filename,
            jd_text=jd_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích CV: {exc}") from exc

    return result
