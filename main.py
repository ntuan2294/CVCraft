"""
Demo end-to-end: input JD + user profile -> CV qua multi-agent pipeline.
"""
import os
import json
from dotenv import load_dotenv
from state import CVAgentState
from orchestrator import build_graph

load_dotenv()


# === SAMPLE INPUT ===

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
               "đặc biệt mạnh về Python và cloud architecture. Đang tìm cơ hội ở fintech.",
    # Đường dẫn template DOCX (placeholder dạng {{FIELD_NAME}})
    # Để None nếu không muốn render template
    "template_path": "template.docx",
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


def print_section(title):
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print('=' * 70)


def main():
    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Cần set OPENAI_API_KEY trong file .env hoặc environment")
        print("    export OPENAI_API_KEY=sk-...")
        return

    # Build graph
    print_section("KHỞI TẠO MULTI-AGENT GRAPH")
    graph = build_graph()
    print("✓ Graph compiled thành công")

    # Tạo initial state
    initial_state = CVAgentState(
        job_description=SAMPLE_JD,
        user_input=SAMPLE_USER_INPUT,
        max_revisions=2,
    )

    # Chạy graph
    print_section("CHẠY PIPELINE")
    print("⏳ Đang xử lý... (có thể mất 30-60 giây)\n")

    final_state = graph.invoke(initial_state)

    # Hiển thị log
    print_section("LOG CỦA CÁC AGENT")
    # final_state là dict (không phải Pydantic) sau invoke
    for msg in final_state.get("messages", []):
        print(f"  {msg}")

    # Hiển thị kết quả
    print_section("KẾT QUẢ - JOB REQUIREMENT (đã phân tích)")
    jd_req = final_state.get("job_requirement")
    if jd_req:
        print(f"  Position: {jd_req.job_title}")
        print(f"  Level: {jd_req.seniority_level}")
        print(f"  Required: {jd_req.required_skills}")
        print(f"  Keywords: {jd_req.keywords}")

    print_section("KẾT QUẢ - CV DRAFT")
    draft = final_state.get("cv_draft")
    if draft:
        if draft.summary:
            print("\n📝 SUMMARY:")
            print(f"  {draft.summary}")

        if draft.experiences:
            print("\n💼 EXPERIENCE:")
            for exp in draft.experiences:
                print(f"\n  {exp.position} | {exp.company}")
                print(f"  {exp.start_date} - {exp.end_date or 'Present'}")
                for bullet in exp.bullets:
                    print(f"    • {bullet}")

        if draft.skills_categorized:
            print("\n🛠  SKILLS:")
            for cat, skills in draft.skills_categorized.items():
                print(f"  {cat}: {', '.join(skills)}")

    print_section("KẾT QUẢ - QUALITY SCORE")
    score = final_state.get("quality_score")
    if score:
        print(f"  Overall:    {score.overall_score:.1f}/10")
        print(f"  ATS:        {score.ats_score:.1f}/10")
        print(f"  JD Match:   {score.jd_match_score:.1f}/10")
        print(f"  Linguistic: {score.linguistic_score:.1f}/10")
        print(f"  Revisions:  {final_state.get('revision_count', 0)}")
        if score.feedback:
            print("\n  📋 Feedback:")
            for f in score.feedback:
                print(f"    - {f}")

    # Output file (nếu render template)
    output_path = final_state.get("output_path")
    if output_path:
        print_section("FILE OUTPUT")
        print(f"  📄 CV đã được render vào: {output_path}")

    print()


if __name__ == "__main__":
    main()