"""
CLI commands cho JD Search service.

Usage:
    python -m jd_search.cli.commands build-jd-index
    python -m jd_search.cli.commands build-seed-index
    python -m jd_search.cli.commands jd-search "backend python"
    python -m jd_search.cli.commands jd-stats

    # Sau khi pip install -e .
    jd-search build-jd-index
    jd-search jd-search "backend python"
"""
import os
from pathlib import Path

import typer
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).parents[4]
load_dotenv(REPO_ROOT / ".env")

app = typer.Typer(
    name="jd-search",
    help="Semantic JD Search with AI-formatted JD sections",
    add_completion=False,
)


# ============ HELPERS ============

def _section(title: str):
    typer.echo(f"\n{'=' * 70}")
    typer.echo(f"  {title}")
    typer.echo('=' * 70)


# ============ COMMANDS ============

@app.command("build-jd-index")
def build_jd_index(
    reset: bool = typer.Option(False, "--reset", help="Xóa và re-index JD collection"),
    max_records: int = typer.Option(3000, "--max-records", "-n", help="Số JD tối đa lấy (0 = tất cả)"),
):
    """Build RAG JD index từ HuggingFace dataset tinixai/vietnamese-job-descriptions (year=2026)."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from jd_search.services.jd_search_service import JDSearchService

    service = JDSearchService()
    result = service.build_hf_index(reset=reset, max_records=max_records)

    if result.get("skipped"):
        typer.echo("✓ JD index đã có data. Dùng --reset để re-index.")
    else:
        typer.echo(f"Indexed {result['indexed']} job descriptions.")


@app.command("build-seed-index")
def build_seed_index(
    reset: bool = typer.Option(False, "--reset", help="Xóa và re-index"),
):
    """Build JD index từ 30 seed samples (không cần HuggingFace)."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from jd_search.services.jd_search_service import JDSearchService

    service = JDSearchService()
    result = service.build_seed_index(reset=reset)

    if result.get("skipped"):
        typer.echo("✓ JD index đã có data. Dùng --reset để re-index.")
    else:
        typer.echo(f"✅ Indexed {result['indexed']} seed job descriptions.")


@app.command("jd-search")
def jd_search(
    query: str = typer.Argument(..., help="Mô tả công việc hoặc kỹ năng mong muốn"),
):
    """Tìm kiếm Job Description (similarity >= 0.5)."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from jd_search.services.jd_search_service import JDSearchService

    typer.echo(f"Searching for: \"{query}\"\n")
    service = JDSearchService()
    response = service.search(query=query)

    _section("KẾT QUẢ TÌM KIẾM (similarity >= 0.5)")
    if not response.top_jds:
        typer.echo("  Không tìm thấy JD phù hợp.")
        return

    for i, result in enumerate(response.top_jds, 1):
        jd = result.jd
        typer.echo(f"  {i}. [{result.similarity_score:.2f}] {jd.title} | {jd.seniority or '?'} | {jd.company or '?'}")
        typer.echo(f"     Skills: {', '.join(jd.required_skills[:5])}")
    typer.echo()


@app.command("jd-stats")
def jd_stats():
    """Hiển thị thống kê JD vector store."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from jd_search.services.jd_search_service import JDSearchService

    service = JDSearchService()
    stats = service.get_stats()
    typer.echo(f"Job Descriptions: {stats['job_descriptions']}")
    typer.echo(f"Is empty:         {stats['is_empty']}")


if __name__ == "__main__":
    app()
