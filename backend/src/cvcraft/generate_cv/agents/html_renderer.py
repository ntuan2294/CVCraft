"""HTML template renderer for generated CV drafts."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any

from cvcraft.generate_cv.core.state import CVAgentState


def compact_text(value: Any) -> str:
    text = str(value or "")
    # Remove PDF/copy-paste hyphenation artifacts: "fine- \ntuning" → "fine-tuning"
    text = re.sub(r"(\w)-[ \t]*\n[ \t]*(\w)", r"\1-\2", text)
    # Remove mid-word line breaks: "Lang\nChain" → "LangChain"
    text = re.sub(r"(?<=[A-Za-z])[ \t]*\n[ \t]*(?=[A-Za-z])", "", text)
    return re.sub(r"\s+", " ", text).strip()


def esc(value: Any) -> str:
    text = compact_text(value)
    text = html.unescape(text)  # normalise pre-encoded entities from LLM output
    return html.escape(text, quote=False)  # text content — apostrophes don't need escaping


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
    photo_url = ""
    if profile.photo and profile.photo.get("data_url"):
        photo_url = html.escape(profile.photo["data_url"], quote=True)
        photo = f'<img src="{photo_url}" alt="">'

    certifications = [
        {"name": c.get("name", ""), "issuer": c.get("issuer"), "date": c.get("date")}
        for c in profile.certifications
        if c.get("name")
    ]

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
        "certifications": certifications,
        "references": profile.references or "",
        "photo": photo,
        "photo_url": photo_url,
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


def render_plain_experience_entries(experiences: list[dict[str, Any]]) -> str:
    entries = []
    for exp in experiences:
        bullets = "\n".join(f"        <li>{esc(bullet)}</li>" for bullet in exp.get("bullets", []))
        entries.append(
            f"""
      <div class="experience-head">
        <div>
          <div class="role">{esc(exp.get("job_title"))}</div>
          <div class="company">{esc(exp.get("company"))}</div>
        </div>
        <div class="date">{esc(exp.get("time"))}</div>
      </div>
      <ul>
{bullets}
      </ul>""".rstrip()
        )
    return "\n".join(entries)


def render_plain_education_entries(educations: list[dict[str, Any]]) -> str:
    entries = []
    for edu in educations:
        detail = f'<div class="edu-detail">{esc(edu.get("detail"))}</div>' if edu.get("detail") else ""
        entries.append(
            f"""
      <div class="education-row">
        <div>{esc(edu.get("school"))}</div>
        <div class="date">{esc(edu.get("time"))}</div>
      </div>
      {detail}""".rstrip()
        )
    return "\n".join(entries)


def render_minimal_education_entries(educations: list[dict[str, Any]]) -> str:
    entries = []
    for edu in educations:
        detail = f'<div class="edu-detail">{esc(edu.get("detail"))}</div>' if edu.get("detail") else ""
        entries.append(
            f"""
        <div class="education-entry">
          <div class="edu-school">{esc(edu.get("school"))}</div>
          <div class="edu-time">{esc(edu.get("time"))}</div>
          {detail}
        </div>""".rstrip()
        )
    return "\n".join(entries)


def render_minimal_skill_entries(skills: list[str]) -> str:
    clean_skills = [compact_text(skill) for skill in skills if compact_text(skill)]
    if not clean_skills:
        return _editable_block("Add your skills here…")

    midpoint = (len(clean_skills) + 1) // 2

    def _column(items: list[str]) -> str:
        rows = "\n".join(f"          <li>{esc(item)}</li>" for item in items)
        return f"        <ul>\n{rows}\n        </ul>"

    return "\n".join(_column(part) for part in [clean_skills[:midpoint], clean_skills[midpoint:]] if part)


def render_timeline_education_entries(educations: list[dict[str, Any]]) -> str:
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


def render_certificate_entries(certificates: list[dict[str, Any]]) -> str:
    if not certificates:
        return ""
    entries = []
    for cert in certificates:
        name = esc(cert.get("name", ""))
        if not name:
            continue
        meta_parts = [p for p in [cert.get("issuer"), cert.get("date")] if p]
        meta = esc(" · ".join(compact_text(p) for p in meta_parts)) if meta_parts else ""
        entry = f'<div class="cert-entry"><div class="cert-name">{name}</div>'
        if meta:
            entry += f'<div class="cert-meta">{meta}</div>'
        entry += "</div>"
        entries.append(entry)
    return "\n".join(entries)


def _editable(token_name: str) -> str:
    label = token_name.replace("_", " ").title()
    return f'<span contenteditable="true" class="editable-field" data-placeholder="{label}"></span>'


def _editable_block(placeholder: str) -> str:
    return f'<div contenteditable="true" class="editable-field editable-block" data-placeholder="{placeholder}"></div>'


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

    def _replace(token: str, value: str) -> None:
        nonlocal content
        if value:
            content = content.replace(token, value)

    _replace("{{FULL_NAME}}", esc(fields.get("full_name")))
    _replace("{{JOB_TITLE}}", esc(fields.get("job_title")))
    _replace("{{ABOUT_ME}}", esc(fields.get("about_me")))
    _replace("{{SUMMARY}}", esc(fields.get("about_me")))
    _replace("{{PROFILE}}", esc(fields.get("about_me")))
    _replace("{{PHONE_NUMBER}}", esc(fields.get("phone_number")))
    _replace("{{GMAIL}}", esc(fields.get("gmail")))
    _replace("{{EMAIL}}", esc(fields.get("gmail")))
    _replace("{{LINKED_IN}}", esc(fields.get("linked_in")))
    _replace("{{LINKEDIN}}", esc(fields.get("linked_in")))
    _replace("{{ADDRESS}}", esc(fields.get("address")))
    _replace("{{SKILLS}}", html_lines(fields.get("skills", [])))
    _replace("{{LANGUAGES}}", html_lines(fields.get("languages", [])))
    _replace("{{CERTIFICATES}}", render_certificate_entries(fields.get("certifications", [])))
    _replace("{{CERTIFICATE}}", render_certificate_entries(fields.get("certifications", [])))
    content = content.replace("{{PHOTO_URL}}", fields.get("photo_url") or "")
    content = content.replace("{{PHOTO}}", fields.get("photo") or "PHOTO")

    is_plain_template = 'class="experience-head"' in content
    is_minimal_template = 'class="education-grid"' in content
    is_timeline_template = 'class="timeline-body"' in content
    exp_html = (
        render_plain_experience_entries(fields.get("experiences", []))
        if is_plain_template
        else render_experience_entries(fields.get("experiences", []))
    )
    if not exp_html:
        exp_html = _editable_block("Add your work experience here…")
    if is_plain_template:
        content = re.sub(
            r'(<section>\s*<h2>Professional Experience</h2>).*?(</section>)',
            lambda m: f'{m.group(1)}\n{exp_html}\n    {m.group(2)}',
            content,
            flags=re.S,
        )
    else:
        content = re.sub(
            r'<div class="experience">.*?</div>\s*<!-- education -->',
            f'<div class="experience">\n      {exp_html}\n    </div>\n\n    <!-- education -->',
            content,
            flags=re.S,
        )

    if is_minimal_template:
        edu_html = render_minimal_education_entries(fields.get("educations", []))
    elif is_timeline_template:
        edu_html = render_timeline_education_entries(fields.get("educations", []))
    elif is_plain_template:
        edu_html = render_plain_education_entries(fields.get("educations", []))
    else:
        edu_html = render_education_entries(fields.get("educations", []))
    if not edu_html:
        edu_html = _editable_block("Add your education here…")
    if is_minimal_template:
        content = re.sub(
            r'<div class="education-grid">.*?</div>\s*</section>',
            f'<div class="education-grid">\n{edu_html}\n      </div>\n    </section>',
            content,
            flags=re.S,
        )
        skills_html = render_minimal_skill_entries(fields.get("skills", []))
        content = re.sub(
            r'<div class="skills-grid">.*?</div>',
            f'<div class="skills-grid">\n{skills_html}\n      </div>',
            content,
            flags=re.S,
        )
    elif is_timeline_template:
        content = re.sub(
            r'(<h2 class="main-heading">.*?Education.*?</h2>\s*<div class="timeline-body">\s*<div class="timeline-rail"><span class="timeline-dot"></span></div>).*?(</div>\s*</section>)',
            lambda m: f'{m.group(1)}\n        <div>\n{edu_html}\n        </div>\n      {m.group(2)}',
            content,
            flags=re.S,
        )
    elif is_plain_template:
        content = re.sub(
            r'(<section>\s*<h2>Education</h2>).*?(</section>)',
            lambda m: f'{m.group(1)}\n{edu_html}\n    {m.group(2)}',
            content,
            flags=re.S,
        )
    else:
        content = re.sub(
            r'<div class="education-entry">.*?</div>',
            edu_html,
            content,
            flags=re.S,
        )

    content = re.sub(r"\{\{([A-Z_][A-Z0-9_]*)\}\}", lambda m: _editable(m.group(1)), content)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    _write_meta(output_path, fields, str(template_path))
    return {"filled": len(fields), "output_path": str(output_path)}
