"""
Seed CV dataset cho RAG (Tier 1 - hand-curated).

20 mẫu chất lượng cao được biên tập kỹ, đa dạng:
- 6 ngành: tech, marketing, finance, design, product, sales
- 3 levels: junior, mid, senior
- Mỗi mẫu có summary tốt + 4-5 STAR bullets có lượng hóa

Trong khóa luận thực tế nên mở rộng lên 50-100 mẫu manual + dùng kèm
HuggingFace dataset (Tier 2) để có volume.

Schema mỗi entry:
{
    "id": str,                      # unique identifier
    "industry": str,                # tech | marketing | finance | design | product | sales
    "domain": str,                  # subfield trong industry
    "seniority": str,               # junior | mid | senior
    "job_title": str,
    "summary": str,                 # 50-100 từ
    "experience_bullets": [str],    # 4-5 bullets STAR
}
"""

CV_SAMPLES = [
    # ============================================================
    # TECH - BACKEND (3 levels)
    # ============================================================
    {
        "id": "tech_backend_junior_01",
        "industry": "tech",
        "domain": "backend",
        "seniority": "junior",
        "job_title": "Junior Backend Developer",
        "summary": (
            "Junior Backend Developer with 1.5 years of experience building "
            "RESTful APIs and microservices using Python and Node.js. Solid "
            "foundation in PostgreSQL, Redis, and Docker. Eager to grow in "
            "cloud-native development and contribute to scalable backend systems."
        ),
        "experience_bullets": [
            "Developed 8 RESTful API endpoints for e-commerce checkout flow using FastAPI and PostgreSQL, handling 5K daily transactions",
            "Implemented Redis caching layer that reduced product catalog query time from 400ms to 80ms",
            "Wrote unit tests using pytest achieving 75% code coverage, catching 12 bugs before production deployment",
            "Collaborated with senior engineers to migrate 3 legacy services to Docker containers, improving deployment consistency",
        ],
    },
    {
        "id": "tech_backend_mid_01",
        "industry": "tech",
        "domain": "backend",
        "seniority": "mid",
        "job_title": "Backend Developer",
        "summary": (
            "Backend Developer with 4 years building RESTful APIs and microservices "
            "for fintech applications. Strong expertise in Node.js, PostgreSQL, and "
            "Redis. Passionate about writing clean, testable code and optimizing "
            "system performance at scale."
        ),
        "experience_bullets": [
            "Developed payment processing API integrating Stripe and VNPay, handling $2M+ monthly transaction volume with zero data loss",
            "Optimized PostgreSQL queries and implemented Redis caching layer, reducing average API response time from 800ms to 120ms",
            "Built automated testing suite with 90% code coverage using Jest and Supertest, catching 30+ critical bugs before production",
            "Collaborated with frontend team on RESTful API design serving 10K daily active users",
            "Mentored 2 junior developers on best practices for async programming and error handling",
        ],
    },
    {
        "id": "tech_backend_senior_01",
        "industry": "tech",
        "domain": "backend",
        "seniority": "senior",
        "job_title": "Senior Backend Engineer",
        "summary": (
            "Senior Backend Engineer with 7 years architecting distributed systems "
            "serving millions of users. Specialized in Python, Go, and cloud-native "
            "architecture on AWS. Proven track record of leading teams to deliver "
            "high-throughput, low-latency services for fintech and e-commerce platforms."
        ),
        "experience_bullets": [
            "Architected microservices platform processing 50M+ daily transactions, reducing P99 latency by 65% through Redis caching and database sharding",
            "Led migration of legacy monolith to Kubernetes-based microservices on AWS EKS, completing 3 months ahead of schedule and saving $180K annually in infrastructure costs",
            "Mentored team of 6 backend engineers, established code review standards and CI/CD pipelines that reduced production incidents by 40%",
            "Designed event-driven architecture using Kafka and AWS SQS, enabling real-time data processing for 100K+ concurrent users",
            "Implemented OAuth 2.0 and JWT-based authentication system serving 5M users with 99.99% uptime SLA",
        ],
    },

    # ============================================================
    # TECH - FRONTEND (2 levels)
    # ============================================================
    {
        "id": "tech_frontend_mid_01",
        "industry": "tech",
        "domain": "frontend",
        "seniority": "mid",
        "job_title": "Frontend Developer",
        "summary": (
            "Frontend Developer with 3 years crafting responsive, accessible web "
            "applications using React and TypeScript. Experience with state management, "
            "performance optimization, and modern build tools. Strong eye for design "
            "and user experience details."
        ),
        "experience_bullets": [
            "Built customer dashboard using React, TypeScript, and Redux Toolkit serving 50K monthly active users",
            "Improved Lighthouse performance score from 62 to 94 by code-splitting, lazy loading, and image optimization",
            "Implemented shared component library with 30+ reusable components, reducing duplicate code by 40% across 3 apps",
            "Migrated legacy jQuery codebase to React over 6 months while maintaining feature parity and zero user-facing downtime",
        ],
    },
    {
        "id": "tech_frontend_senior_01",
        "industry": "tech",
        "domain": "frontend",
        "seniority": "senior",
        "job_title": "Senior Frontend Engineer",
        "summary": (
            "Senior Frontend Engineer with 6 years crafting performant, accessible "
            "web applications using React and TypeScript. Track record of leading "
            "design systems and optimizing Core Web Vitals for SaaS platforms with "
            "1M+ users."
        ),
        "experience_bullets": [
            "Led development of company-wide design system using React, TypeScript, and Storybook, adopted by 12 product teams and reducing UI development time by 50%",
            "Improved Core Web Vitals across main product, achieving LCP under 2.5s and CLS below 0.1, contributing to 23% increase in conversion rate",
            "Architected micro-frontend setup using Module Federation, enabling independent deployments for 5 product teams",
            "Mentored 4 junior developers through code reviews, pair programming, and weekly tech talks on React patterns and performance",
            "Spearheaded accessibility audit covering WCAG 2.1 AA standards, fixing 80+ issues across the product",
        ],
    },

    # ============================================================
    # TECH - DATA (2 levels)
    # ============================================================
    {
        "id": "tech_data_mid_01",
        "industry": "tech",
        "domain": "data",
        "seniority": "mid",
        "job_title": "Data Engineer",
        "summary": (
            "Data Engineer with 4 years building scalable ETL pipelines and data "
            "warehouses on GCP and AWS. Specialized in Apache Spark, Airflow, and "
            "dbt. Experience designing data architectures supporting analytics and "
            "ML workloads for marketing and product teams."
        ),
        "experience_bullets": [
            "Designed and implemented ETL pipelines processing 500GB daily using Apache Spark on Databricks, reducing batch processing time from 8 hours to 90 minutes",
            "Built dimensional data model in BigQuery with dbt, enabling self-service analytics for 50+ business users and reducing reporting requests by 70%",
            "Orchestrated 200+ Airflow DAGs with SLA monitoring and alerting, achieving 99.5% pipeline reliability",
            "Migrated legacy Hadoop infrastructure to GCP, cutting infrastructure costs by 40% while improving query performance",
        ],
    },
    {
        "id": "tech_data_senior_01",
        "industry": "tech",
        "domain": "data",
        "seniority": "senior",
        "job_title": "Senior Data Scientist",
        "summary": (
            "Senior Data Scientist with 8 years applying machine learning to solve "
            "business problems in e-commerce and fintech. Deep expertise in Python, "
            "TensorFlow, and large-scale recommendation systems. Track record of "
            "shipping ML models that drive measurable revenue impact."
        ),
        "experience_bullets": [
            "Designed and deployed personalized recommendation system using neural collaborative filtering, increasing average order value by 18% and adding $8M ARR",
            "Built fraud detection model achieving 94% precision and 89% recall, reducing chargebacks by $2.3M annually",
            "Led team of 4 data scientists to build customer churn prediction pipeline, enabling targeted retention campaigns that reduced churn by 22%",
            "Productionized 12 ML models using MLflow and Kubernetes, establishing model monitoring and A/B testing framework",
            "Published 3 internal research papers on transformer-based product embeddings, presented at company-wide ML summit",
        ],
    },

    # ============================================================
    # TECH - DEVOPS (1 level)
    # ============================================================
    {
        "id": "tech_devops_senior_01",
        "industry": "tech",
        "domain": "devops",
        "seniority": "senior",
        "job_title": "Senior DevOps Engineer",
        "summary": (
            "Senior DevOps Engineer with 6 years building reliable infrastructure "
            "and automation for high-traffic SaaS products. Expert in Kubernetes, "
            "Terraform, and observability tooling. Passionate about platform "
            "engineering and developer experience."
        ),
        "experience_bullets": [
            "Designed multi-region Kubernetes infrastructure on AWS EKS serving 50M+ daily requests with 99.99% availability SLA",
            "Built internal developer platform reducing service onboarding time from 2 weeks to 4 hours through automated provisioning",
            "Implemented observability stack with Prometheus, Grafana, and Loki across 80+ services, cutting MTTR from 45min to 8min",
            "Migrated CI/CD from Jenkins to GitHub Actions, reducing build times by 60% and saving $50K/year in licensing",
            "Led security hardening initiative implementing zero-trust networking, passing SOC 2 Type II audit",
        ],
    },

    # ============================================================
    # MARKETING (3 levels)
    # ============================================================
    {
        "id": "marketing_content_junior_01",
        "industry": "marketing",
        "domain": "content",
        "seniority": "junior",
        "job_title": "Content Marketing Associate",
        "summary": (
            "Content Marketing Associate with 1.5 years creating SEO-optimized "
            "content for B2B SaaS brands. Skilled in keyword research, content "
            "writing, and basic analytics. Eager to grow expertise in content "
            "strategy and demand generation."
        ),
        "experience_bullets": [
            "Wrote 40+ SEO blog articles averaging 1,500 words, generating 35K organic monthly visitors within 6 months",
            "Conducted keyword research using Ahrefs to identify 60 ranking opportunities with combined search volume of 80K/month",
            "Managed editorial calendar across blog and newsletter, maintaining consistent publishing schedule of 8 pieces/month",
            "Optimized 25 existing articles for featured snippets, capturing position-zero rankings for 12 target keywords",
        ],
    },
    {
        "id": "marketing_content_mid_01",
        "industry": "marketing",
        "domain": "content",
        "seniority": "mid",
        "job_title": "Content Marketing Specialist",
        "summary": (
            "Content Marketing Specialist with 4 years creating data-driven content "
            "strategies for SaaS and e-commerce brands. Skilled in SEO writing, "
            "content production, and audience analytics. Track record of growing "
            "organic traffic and lead generation through strategic content."
        ),
        "experience_bullets": [
            "Developed content strategy producing 80+ blog articles annually, growing organic traffic by 220% and generating 3,500 qualified leads in 12 months",
            "Managed editorial calendar across blog, social media, and newsletter, increasing engagement rate by 45% through audience segmentation",
            "Conducted keyword research and competitive analysis using Ahrefs, identifying 150+ ranking opportunities with combined search volume of 200K/month",
            "Collaborated with product and sales teams to create case studies that contributed to 18% lift in demo bookings",
        ],
    },
    {
        "id": "marketing_digital_senior_01",
        "industry": "marketing",
        "domain": "digital",
        "seniority": "senior",
        "job_title": "Senior Digital Marketing Manager",
        "summary": (
            "Senior Digital Marketing Manager with 7 years driving growth for B2C "
            "and B2B brands across SEA region. Expert in performance marketing, SEO, "
            "and content strategy. Consistently delivered 3-5x ROAS through "
            "data-driven campaigns spanning Facebook, Google Ads, and TikTok."
        ),
        "experience_bullets": [
            "Scaled monthly ad spend from $50K to $500K across Meta and Google, maintaining 4.2x ROAS while expanding to 5 new markets in Southeast Asia",
            "Led SEO strategy that grew organic traffic 380% in 18 months, reaching 2M monthly visitors and generating $1.2M in attributed revenue",
            "Built and managed team of 8 specialists across paid media, content, and analytics, reducing CAC by 35% through cross-channel optimization",
            "Launched influencer marketing program with 50+ creators, generating 15M impressions and 8% engagement rate—2x industry benchmark",
            "Implemented attribution model using mixed-media modeling, reallocating $200K budget to higher-ROI channels",
        ],
    },

    # ============================================================
    # FINANCE (2 levels)
    # ============================================================
    {
        "id": "finance_analyst_mid_01",
        "industry": "finance",
        "domain": "analyst",
        "seniority": "mid",
        "job_title": "Financial Analyst",
        "summary": (
            "Financial Analyst with 4 years experience in FP&A and corporate finance "
            "at multinational firms. Expert in financial modeling, budgeting, and "
            "variance analysis. Adept at translating complex data into actionable "
            "insights for executive stakeholders."
        ),
        "experience_bullets": [
            "Built three-statement financial model and DCF valuation for $80M acquisition, identified $5M in cost synergies adopted in final deal terms",
            "Led monthly forecasting and variance analysis for $200M business unit, improving forecast accuracy from 85% to 96% through driver-based modeling",
            "Automated weekly management reporting using Power BI and Python, reducing preparation time from 2 days to 3 hours",
            "Partnered with department heads on annual budgeting cycle, identifying $1.8M in cost optimization opportunities across operations",
        ],
    },
    {
        "id": "finance_investment_senior_01",
        "industry": "finance",
        "domain": "investment",
        "seniority": "senior",
        "job_title": "Senior Investment Analyst",
        "summary": (
            "Senior Investment Analyst with 8 years in equity research and portfolio "
            "management, focused on technology and consumer sectors. CFA charterholder "
            "with deep expertise in financial modeling, valuation, and ESG analysis. "
            "Track record of generating alpha through fundamental research."
        ),
        "experience_bullets": [
            "Managed equity portfolio of $250M with consistent outperformance of benchmark by 320bps annually over 5 years",
            "Authored 60+ research reports on tech and consumer stocks, with buy/sell recommendations achieving 78% accuracy rate",
            "Led due diligence on $40M growth equity investment in B2B SaaS company, building financial model and deal memo",
            "Developed proprietary screening model using Python and SQL, identifying 12 high-conviction ideas that returned avg 35%",
            "Mentored 3 junior analysts on financial modeling and investment thesis writing",
        ],
    },

    # ============================================================
    # DESIGN (2 levels)
    # ============================================================
    {
        "id": "design_product_mid_01",
        "industry": "design",
        "domain": "product",
        "seniority": "mid",
        "job_title": "Product Designer",
        "summary": (
            "Product Designer with 3 years designing B2C mobile and web experiences "
            "for e-commerce platforms. Strong skills in user research, wireframing, "
            "and prototyping with Figma. Passionate about creating accessible, "
            "delightful experiences backed by user data."
        ),
        "experience_bullets": [
            "Redesigned checkout flow for mobile app, reducing cart abandonment by 24% and increasing completed transactions by 18%",
            "Conducted 25+ usability tests and 40+ user interviews to inform redesign of product discovery experience",
            "Built and maintained Figma component library with 50+ components, adopted across 3 product teams",
            "Collaborated with engineers and PMs in 2-week sprints, shipping 15 feature improvements in 2024",
        ],
    },
    {
        "id": "design_product_senior_01",
        "industry": "design",
        "domain": "product",
        "seniority": "senior",
        "job_title": "Senior Product Designer",
        "summary": (
            "Senior Product Designer with 6 years designing intuitive B2B SaaS "
            "experiences for fintech and HR platforms. Specialized in user research, "
            "design systems, and end-to-end product design. Proven ability to "
            "translate complex workflows into delightful user experiences."
        ),
        "experience_bullets": [
            "Led end-to-end redesign of core dashboard used by 200K+ users, improving task completion rate by 38% and NPS from 32 to 51",
            "Built and maintained design system in Figma covering 80+ components, adopted across 4 product teams and reducing design-to-dev handoff time by 60%",
            "Conducted 30+ user research sessions per quarter, synthesizing findings into actionable roadmap that informed 12 major feature launches",
            "Mentored 3 junior designers through portfolio reviews, design critiques, and structured learning paths",
            "Established design ops practices including weekly critiques and design system governance, improving team velocity by 30%",
        ],
    },

    # ============================================================
    # PRODUCT MANAGEMENT (2 levels)
    # ============================================================
    {
        "id": "product_pm_mid_01",
        "industry": "product",
        "domain": "product_management",
        "seniority": "mid",
        "job_title": "Product Manager",
        "summary": (
            "Product Manager with 4 years building B2C mobile features in e-commerce "
            "and on-demand services. Skilled in user research, data analysis, and "
            "stakeholder management. Track record of shipping features that improve "
            "key metrics through rigorous experimentation."
        ),
        "experience_bullets": [
            "Owned end-to-end product strategy for search feature serving 2M MAU, improving search-to-purchase conversion by 16%",
            "Led 18 A/B tests across onboarding and checkout flows, with 9 winning experiments contributing $1.5M ARR",
            "Defined product requirements and roadmap for 3 quarterly cycles, collaborating with 12-person cross-functional team",
            "Reduced customer support tickets by 35% by identifying top 5 friction points and prioritizing UX improvements",
        ],
    },
    {
        "id": "product_pm_senior_01",
        "industry": "product",
        "domain": "product_management",
        "seniority": "senior",
        "job_title": "Senior Product Manager",
        "summary": (
            "Senior Product Manager with 7 years leading B2C mobile products from "
            "ideation to launch. Combines technical background with strong customer "
            "empathy to ship features that drive measurable business outcomes. "
            "Experience in fintech, ride-hailing, and e-commerce verticals."
        ),
        "experience_bullets": [
            "Owned end-to-end product strategy for payment feature reaching 5M MAU, growing transaction volume 4x and contributing $12M ARR within 18 months",
            "Led cross-functional team of 15 (eng, design, data, ops) to launch loyalty program, increasing user retention by 28% and average order frequency by 45%",
            "Defined product OKRs and quarterly roadmap aligned with company strategy, presented to executive leadership and approved 3 quarters in a row",
            "Conducted weekly user interviews and analyzed product analytics in Mixpanel/Amplitude, surfacing insights that drove 5 high-impact feature pivots",
            "Mentored 2 associate PMs on product discovery, prioritization frameworks, and stakeholder communication",
        ],
    },

    # ============================================================
    # SALES (2 levels)
    # ============================================================
    {
        "id": "sales_b2b_mid_01",
        "industry": "sales",
        "domain": "b2b",
        "seniority": "mid",
        "job_title": "Account Executive",
        "summary": (
            "Account Executive with 4 years closing mid-market B2B SaaS deals in the "
            "$25K-$150K range. Strong consultative selling approach with deep expertise "
            "in solution discovery and value-based negotiation. Consistently exceeded "
            "quota with focus on long-term client success."
        ),
        "experience_bullets": [
            "Closed $1.8M in new ARR in 2024, achieving 142% of annual quota and ranking #2 of 15 AEs on the team",
            "Built and managed pipeline of 80+ qualified opportunities, maintaining 28% win rate on forecasted deals",
            "Reduced average sales cycle from 95 to 68 days by introducing structured discovery framework and ROI calculator",
            "Partnered with customer success to drive 92% renewal rate and 35% expansion revenue from existing accounts",
        ],
    },
    {
        "id": "sales_b2b_senior_01",
        "industry": "sales",
        "domain": "b2b",
        "seniority": "senior",
        "job_title": "Senior Account Executive",
        "summary": (
            "Senior Account Executive with 8 years selling enterprise SaaS solutions "
            "to Fortune 1000 companies. Expert in complex deal navigation, executive "
            "engagement, and team-based selling. Built and grew strategic territories "
            "generating multi-million dollar pipeline."
        ),
        "experience_bullets": [
            "Closed $4.2M in new ARR in 2024 including the largest deal in company history ($850K TCV) with a global manufacturer",
            "Achieved President's Club 3 years in a row, consistently exceeding annual quota by 130%+",
            "Built and managed enterprise territory from $200K to $3.5M ARR over 4 years through strategic account planning",
            "Led RFP responses for 12 enterprise opportunities, winning 8 against direct competitors through differentiated value proposition",
            "Mentored 5 junior AEs on consultative selling and deal strategy, with 3 promoted to senior roles",
        ],
    },
]


# ============================================================
# HELPERS
# ============================================================

def filter_samples(
    industry: str = None,
    seniority: str = None,
    domain: str = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Filter dataset bằng metadata (không qua vector search).

    Args:
        industry: tech | marketing | finance | design | product | sales
        seniority: junior | mid | senior
        domain: subfield (backend, frontend, data, devops, content, ...)
        top_k: số lượng max trả về

    Returns:
        List samples match filter, tối đa top_k items.
    """
    results = []
    for sample in CV_SAMPLES:
        if industry and sample["industry"] != industry:
            continue
        if seniority and sample["seniority"] != seniority:
            continue
        if domain and sample["domain"] != domain:
            continue
        results.append(sample)
    return results[:top_k]


def get_stats() -> dict:
    """Trả về thống kê dataset, hữu ích cho báo cáo khóa luận."""
    from collections import Counter

    industries = Counter(s["industry"] for s in CV_SAMPLES)
    seniorities = Counter(s["seniority"] for s in CV_SAMPLES)
    domains = Counter(s["domain"] for s in CV_SAMPLES)

    total_bullets = sum(len(s["experience_bullets"]) for s in CV_SAMPLES)
    avg_bullets = total_bullets / len(CV_SAMPLES) if CV_SAMPLES else 0

    return {
        "total_samples": len(CV_SAMPLES),
        "industries": dict(industries),
        "seniorities": dict(seniorities),
        "domains": dict(domains),
        "total_bullets": total_bullets,
        "avg_bullets_per_sample": round(avg_bullets, 1),
    }