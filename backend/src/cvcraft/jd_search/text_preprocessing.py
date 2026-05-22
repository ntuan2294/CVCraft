import re


def preprocess_jd_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    text = re.sub(
        r"([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])"
        r"([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ])",
        r"\1\n\2",
        text,
    )

    text = re.sub(r"[●•▪►★✓✔]+\s*", "\n", text)
    text = re.sub(r"^\s*[-*+]\s+", "\n", text, flags=re.MULTILINE)
    text = re.sub(r"(?:^|\n)\s*\d+[\.\)\:]\s+", "\n", text)
    text = re.sub(r"\.\s+(?=[A-ZÀ-Ỹ\d])", ".\n", text)
    text = text.replace(";", "\n")
    text = re.sub(r"\n+", "\n", text)

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return "\n".join(lines)
