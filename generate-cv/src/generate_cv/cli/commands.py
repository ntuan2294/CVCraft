"""
CLI commands cho Generate CV service.

Usage:
    python -m generate_cv.cli.commands generate
    python -m generate_cv.cli.commands build-index
    python -m generate_cv.cli.commands rag-stats

    # Sau khi pip install -e .
    generate-cv generate
    generate-cv build-index
"""
import os
from pathlib import Path

import typer
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).parents[4]
load_dotenv(REPO_ROOT / ".env")

app = typer.Typer(
    name="generate-cv",
    help="AI-powered CV generation with multi-agent pipeline",
    add_completion=False,
)

# ============ SAMPLE DATA (demo) ============

SAMPLE_JD = """
Senior Backend Engineer - Fintech Startup

We're looking for a Senior Backend Engineer with 5+ years of experience to join our
growing fintech team. You'll architect scalable payment systems serving millions of users.

Required:
- 5+ years experience with Python or Node.js
- Strong knowledge of PostgreSQL and Redis
- Experience with microservices architecture
- AWS or GCP experience (must have)
- RESTful API design
- Understanding of CI/CD pipelines

Preferred:
- Experience with Kafka or RabbitMQ
- Knowledge of payment systems (Stripe, PayPal integration)
- Docker and Kubernetes
- Experience leading small teams

Soft skills: Strong communication, problem-solving, ability to work in fast-paced environment.
"""

SAMPLE_USER_INPUT = {
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "phone": "+84 901 234 567",
    "location": "Hanoi, Vietnam",
    "linkedin": "linkedin.com/in/nguyenvana",
    "github": "github.com/nguyenvana",
    "summary": "Backend developer với 6 năm kinh nghiệm xây dựng hệ thống quy mô lớn, "
               "đặc biệt mạnh về Python và cloud architecture.",
    "template_path": "templates/cv_template.docx",
    "work_experiences": [
        {
            "company": "TechCorp Vietnam",
            "position": "Senior Backend Engineer",
            "start_date": "2022-03",
            "end_date": None,
            "description": "Lead backend team 4 người, xây dựng hệ thống e-commerce phục vụ "
                          "1 triệu user. Migrate từ monolith sang microservices dùng Python/FastAPI, "
                          "deploy trên AWS EKS. Optimize database queries giúp giảm response time "
                          "từ 2s xuống 300ms. Setup CI/CD với GitHub Actions.",
        },
        {
            "company": "StartupXYZ",
            "position": "Backend Developer",
            "start_date": "2019-06",
            "end_date": "2022-02",
            "description": "Phát triển REST API cho ứng dụng giao đồ ăn dùng Node.js và PostgreSQL. "
                          "Tích hợp payment gateway (VNPay, Momo). Implement Redis cache giảm load "
                          "database 60%. Viết unit test với coverage 85%.",
        },
    ],
    "educations": [
        {
            "school": "Hanoi University of Science and Technology",
            "degree": "Bachelor",
            "major": "Computer Science",
            "start_date": "2015-09",
            "end_date": "2019-05",
            "gpa": 3.6,
        },
    ],
    "skills": [
        "Python", "Node.js", "FastAPI", "Django", "PostgreSQL", "MongoDB", "Redis",
        "AWS", "Docker", "Kubernetes", "Git", "REST API", "Microservices",
        "GitHub Actions", "Linux", "Communication", "Team Leadership",
    ],
    "projects": [],
}


# ============ HELPERS ============

def _section(title: str):
    typer.echo(f"\n{'=' * 70}")
    typer.echo(f"  {title}")
    typer.echo('=' * 70)


# ============ COMMANDS ============

@app.command()
def generate(
    max_revisions: int = typer.Option(2, "--max-revisions", "-r", help="Số lần QC loop tối đa"),
):
    """Chạy CV generation pipeline với sample data."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY trong file .env hoặc environment", err=True)
        raise typer.Exit(1)

    from generate_cv.services.cv_service import CVService

    _section("KHỞI TẠO MULTI-AGENT GRAPH")
    service = CVService()
    typer.echo("✓ Graph compiled thành công")

    _section("CHẠY PIPELINE")
    typer.echo("⏳ Đang xử lý... (có thể mất 30-60 giây)\n")

    final_state = service.generate_cv(
        jd_text=SAMPLE_JD,
        user_input=SAMPLE_USER_INPUT,
        max_revisions=max_revisions,
    )

    _section("LOG CỦA CÁC AGENT")
    for msg in final_state.get("messages", []):
        typer.echo(f"  {msg}")

    _section("KẾT QUẢ - JOB REQUIREMENT")
    jd_req = final_state.get("job_requirement")
    if jd_req:
        typer.echo(f"  Position: {jd_req.job_title}")
        typer.echo(f"  Level:    {jd_req.seniority_level}")
        typer.echo(f"  Skills:   {jd_req.required_skills}")

    _section("KẾT QUẢ - QUALITY SCORE")
    score = final_state.get("quality_score")
    if score:
        typer.echo(f"  Overall:    {score.overall_score:.1f}/10")
        typer.echo(f"  ATS:        {score.ats_score:.1f}/10")
        typer.echo(f"  JD Match:   {score.jd_match_score:.1f}/10")
        typer.echo(f"  Linguistic: {score.linguistic_score:.1f}/10")
        typer.echo(f"  Revisions:  {final_state.get('revision_count', 0)}")
        if score.feedback:
            typer.echo("\n  Feedback:")
            for f in score.feedback:
                typer.echo(f"    - {f}")

    output_path = final_state.get("output_path")
    if output_path:
        _section("FILE OUTPUT")
        typer.echo(f"  CV đã được render vào: {output_path}")

    typer.echo()


@app.command("build-index")
def build_index(
    reset: bool = typer.Option(False, "--reset", help="Xóa và re-index"),
):
    """Build RAG vector index từ seed samples."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from generate_cv.services.rag_service import RAGService

    typer.echo("Building RAG index...")
    service = RAGService()
    result = service.build_seed_index(reset=reset)

    if result["skipped"]:
        typer.echo("✓ DB đã có data. Dùng --reset để re-index.")
    else:
        typer.echo(f"✅ Indexed {result['summaries_indexed']} summaries, {result['bullets_indexed']} bullets")


@app.command("build-hf-index")
def build_hf_index(
    reset: bool = typer.Option(False, "--reset", help="Xóa và re-index"),
    dataset: str = typer.Option(
        "C0ldSmi1e/resume-dataset",
        "--dataset",
        help="HuggingFace dataset id chứa resume/CV",
    ),
    split: str = typer.Option("train", "--split", help="Dataset split"),
    max_records: int = typer.Option(1000, "--max-records", help="Số CV hợp lệ tối đa muốn tải"),
    no_seed: bool = typer.Option(False, "--no-seed", help="Không index Tier 1 seed kèm Tier 2"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Chỉ tải/parse, không ghi vào ChromaDB"),
):
    """Download CV Tier 2 từ HuggingFace và build RAG vector index."""
    if not dry_run and not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    typer.echo(f"Building CV Tier 2 index from HuggingFace: {dataset}")
    if dry_run:
        from generate_cv.rag.indexing.indexer import index_hf_samples

        result = index_hf_samples(
            reset=reset,
            dataset_name=dataset,
            split=split,
            max_records=max_records,
            include_seed=not no_seed,
            dry_run=True,
        )
    else:
        from generate_cv.services.rag_service import RAGService

        service = RAGService()
        result = service.build_hf_index(
            reset=reset,
            dataset_name=dataset,
            split=split,
            max_records=max_records,
            include_seed=not no_seed,
            dry_run=False,
        )

    if result["skipped"]:
        typer.echo("✓ DB đã có data. Dùng --reset để re-index.")
    elif result.get("dry_run"):
        typer.echo(f"✓ DRY RUN hoàn tất. Parsed {result.get('hf_samples', 0)} HF CV samples.")
    else:
        typer.echo(
            "✅ Indexed "
            f"{result['summaries_indexed']} summaries, "
            f"{result['bullets_indexed']} bullets "
            f"from {result.get('hf_samples', 0)} HF CV samples"
        )


@app.command("rag-stats")
def rag_stats():
    """Hiển thị thống kê RAG vector store."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from generate_cv.services.rag_service import RAGService

    service = RAGService()
    stats = service.get_stats()
    typer.echo(f"Summaries: {stats['summaries']}")
    typer.echo(f"Bullets:   {stats['bullets']}")
    typer.echo(f"Is empty:  {stats['is_empty']}")


if __name__ == "__main__":
    app()
