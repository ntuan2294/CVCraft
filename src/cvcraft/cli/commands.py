"""
CLI commands cho CVCraft.

Usage:
    python -m cvcraft.cli.commands generate
    python -m cvcraft.cli.commands build-index
    python -m cvcraft.cli.commands rag-stats

    # Sau khi pip install -e .
    cvcraft generate
    cvcraft build-index
"""
import os
import typer
from dotenv import load_dotenv

load_dotenv()

app = typer.Typer(
    name="cvcraft",
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

    from cvcraft.services.cv_service import CVService

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

    from cvcraft.services.rag_service import RAGService

    typer.echo("Building RAG index...")
    service = RAGService()
    result = service.build_seed_index(reset=reset)

    if result["skipped"]:
        typer.echo("✓ DB đã có data. Dùng --reset để re-index.")
    else:
        typer.echo(f"✅ Indexed {result['summaries_indexed']} summaries, {result['bullets_indexed']} bullets")


@app.command("rag-stats")
def rag_stats():
    """Hiển thị thống kê RAG vector store."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from cvcraft.services.rag_service import RAGService

    service = RAGService()
    stats = service.get_stats()
    typer.echo(f"Summaries: {stats['summaries']}")
    typer.echo(f"Bullets:   {stats['bullets']}")
    typer.echo(f"Is empty:  {stats['is_empty']}")


@app.command("build-jd-index")
def build_jd_index(
    reset: bool = typer.Option(False, "--reset", help="Xóa và re-index JD collection"),
    target: int = typer.Option(3000, "--target", "-t", help="Số JD muốn index"),
    max_scan: int = typer.Option(50000, "--max-scan", help="Số record HF quét qua"),
):
    """Build RAG JD index từ HuggingFace dataset tinixai/vietnamese-job-descriptions."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from cvcraft.services.jd_search_service import JDSearchService

    service = JDSearchService()
    result = service.build_hf_index(reset=reset, target=target, max_scan=max_scan)

    if result.get("skipped"):
        typer.echo("✓ JD index đã có data. Dùng --reset để re-index.")
    else:
        typer.echo(f"Indexed {result['indexed']} job descriptions.")


@app.command("jd-search")
def jd_search(
    query: str = typer.Argument(..., help="Từ khóa hoặc mô tả công việc mong muốn"),
    top_k: int = typer.Option(5, "--top-k", "-k", help="Số JD trả về"),
    industry: str = typer.Option(None, "--industry", "-i", help="Lọc theo industry"),
    seniority: str = typer.Option(None, "--seniority", "-s", help="Lọc theo cấp độ"),
):
    """Tìm kiếm Job Description theo ngữ nghĩa và nhận gợi ý CV."""
    if not os.getenv("OPENAI_API_KEY"):
        typer.echo("⚠️  Cần set OPENAI_API_KEY", err=True)
        raise typer.Exit(1)

    from cvcraft.services.jd_search_service import JDSearchService

    typer.echo(f"Searching for: \"{query}\"\n")
    service = JDSearchService()
    response = service.search_and_suggest(
        query=query,
        top_k=top_k,
        industry=industry or None,
        seniority=seniority or None,
    )

    _section("TOP MATCHING JOB DESCRIPTIONS")
    for i, result in enumerate(response.top_jds, 1):
        jd = result.jd
        typer.echo(f"  {i}. {jd.title} ({jd.seniority or '?'}) | {jd.company or '?'} | score: {result.similarity_score:.3f}")
        typer.echo(f"     Skills: {', '.join(jd.required_skills[:5])}")

    _section("GỢI Ý TỪ AI")
    s = response.suggestion
    typer.echo(f"\n  Skills cần phát triển:")
    for skill in s.skills_to_develop:
        typer.echo(f"    - {skill}")

    typer.echo(f"\n  Keywords ATS nên thêm vào CV:")
    for kw in s.cv_keywords:
        typer.echo(f"    - {kw}")

    typer.echo(f"\n  Project nên xây dựng / showcase:")
    for proj in s.recommended_projects:
        typer.echo(f"    - {proj}")

    typer.echo(f"\n  Gợi ý viết Summary:")
    typer.echo(f"    {s.summary_tips}")
    typer.echo()


if __name__ == "__main__":
    app()
