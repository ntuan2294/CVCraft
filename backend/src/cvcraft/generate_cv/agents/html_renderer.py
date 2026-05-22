"""HTML template renderer for generated CV drafts."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any

from cvcraft.generate_cv.core.state import CVAgentState


def compact_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def esc(value: Any) -> str:
    return html.escape(compact_text(value), quote=True)


def date_range(start: str, end: str | None, present: str = "Hiện tại") -> str:
    return " - ".join(part for part in [compact_text(start), compact_text(end or present)] if part)


def html_lines(values: list[str]) -> str:
    return "<br>".join(esc(value) for value in values if compact_text(value))


def fields_from_state(state: CVAgentState) -> dict[str, Any]:
    profile = state.user_profile
    draft = state.cv_draft
    if not profile or not draft:
        return {}

    job_title = profile.job_title
    if not job_title and state.job_requirement:
        job_title = state.job_requirement.job_title

    skills: list[str] = []
    if draft.skills_categorized:
        for category, values in draft.skills_categorized.items():
            joined = ", ".join(compact_text(item) for item in values if compact_text(item))
            if joined:
                skills.append(f"{category}: {joined}")
    else:
        skills = [compact_text(item) for item in profile.skills_raw if compact_text(item)]

    experiences = []
    for exp in draft.experiences:
        bullets = exp.bullets or ([exp.raw_description] if exp.raw_description else [])
        experiences.append(
            {
                "company": exp.company,
                "time": date_range(exp.start_date, exp.end_date),
                "job_title": exp.position,
                "bullets": [compact_text(item) for item in bullets if compact_text(item)],
            }
        )

    educations = []
    for edu in draft.educations:
        detail = " - ".join(
            part for part in [compact_text(edu.degree), compact_text(edu.major)] if part
        )
        if edu.gpa:
            detail = f"{detail} | GPA: {edu.gpa}" if detail else f"GPA: {edu.gpa}"
        educations.append(
            {
                "school": edu.school,
                "time": date_range(edu.start_date, edu.end_date, present=""),
                "detail": detail,
            }
        )

    photo = ""
    if profile.photo and profile.photo.get("data_url"):
        photo = f'<img src="{html.escape(profile.photo["data_url"], quote=True)}" alt="">'

    return {
        "full_name": profile.full_name,
        "job_title": job_title,
        "about_me": draft.summary or profile.raw_summary or "",
        "phone_number": profile.phone or "",
        "gmail": profile.email,
        "linked_in": profile.linkedin or profile.github or "",
        "address": profile.location or "",
        "skills": skills,
        "languages": profile.languages,
        "experiences": experiences,
        "educations": educations,
        "photo": photo,
    }


def render_experience_entries(experiences: list[dict[str, Any]]) -> str:
    entries = []
    for exp in experiences:
        bullets = "\n".join(f"<li>{esc(bullet)}</li>" for bullet in exp.get("bullets", []))
        entries.append(
            f"""
      <div class="exp-entry">
        <div class="exp-head">
          <span class="exp-company">{esc(exp.get("company"))}</span>
          <span class="exp-time">{esc(exp.get("time"))}</span>
        </div>
        <div class="exp-role">{esc(exp.get("job_title"))}</div>
        <ul class="exp-bullets">
          {bullets}
        </ul>
      </div>""".rstrip()
        )
    return "\n".join(entries)


def render_education_entries(educations: list[dict[str, Any]]) -> str:
    entries = []
    for edu in educations:
        detail = f'<div class="edu-detail">{esc(edu.get("detail"))}</div>' if edu.get("detail") else ""
        entries.append(
            f"""
    <div class="education-entry">
      <span class="edu-school">{esc(edu.get("school"))}</span>
      <span class="edu-time">{esc(edu.get("time"))}</span>
    </div>
    {detail}""".rstrip()
        )
    return "\n".join(entries)


def _write_meta(output_path: Path, fields: dict[str, Any], template_path: str) -> None:
    output_path.with_suffix(output_path.suffix + ".json").write_text(
        json.dumps({"template_path": template_path, "fields": fields}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def render_html_template(
    template_path: str | Path,
    output_path: str | Path,
    fields: dict[str, Any],
) -> dict[str, Any]:
    template_path = Path(template_path)
    output_path = Path(output_path)
    content = template_path.read_text(encoding="utf-8")

    content = content.replace("{{FULL_NAME}}", esc(fields.get("full_name")))
    content = content.replace("{{JOB_TITLE}}", esc(fields.get("job_title")))
    content = content.replace("{{ABOUT_ME}}", esc(fields.get("about_me")))
    content = content.replace("{{PHONE_NUMBER}}", esc(fields.get("phone_number")))
    content = content.replace("{{GMAIL}}", esc(fields.get("gmail")))
    content = content.replace("{{LINKED_IN}}", esc(fields.get("linked_in")))
    content = content.replace("{{ADDRESS}}", esc(fields.get("address")))
    content = content.replace("{{SKILLS}}", html_lines(fields.get("skills", [])))
    content = content.replace("{{LANGUAGES}}", html_lines(fields.get("languages", [])))
    content = content.replace("{{PHOTO}}", fields.get("photo") or "PHOTO")

    content = re.sub(
        r'<div class="experience">.*?</div>\s*<!-- education -->',
        f'<div class="experience">\n{render_experience_entries(fields.get("experiences", []))}\n    </div>\n\n    <!-- education -->',
        content,
        flags=re.S,
    )
    content = re.sub(
        r'<div class="education-entry">.*?</div>',
        render_education_entries(fields.get("educations", [])),
        content,
        flags=re.S,
    )

    content = re.sub(r"\{\{[A-Z_][A-Z0-9_]*\}\}", "", content)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    _write_meta(output_path, fields, str(template_path))
    return {"filled": len(fields), "output_path": str(output_path)}
