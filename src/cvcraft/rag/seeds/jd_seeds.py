"""
30 Job Description mẫu đa dạng theo industry và seniority.
Dùng để seed ChromaDB `job_descriptions` collection.
"""

JD_SEEDS = [
    # ============================================================
    # TECH - BACKEND (junior / mid / senior)
    # ============================================================
    {
        "id": "jd_tech_backend_junior_01",
        "title": "Junior Backend Developer",
        "company": "TechNova Vietnam",
        "industry": "tech",
        "seniority": "junior",
        "description": (
            "We are looking for a Junior Backend Developer to join our growing engineering team. "
            "You will work closely with senior engineers to build and maintain RESTful APIs for our SaaS platform. "
            "Responsibilities include writing clean, testable Python code, participating in code reviews, "
            "fixing bugs, and contributing to technical documentation. "
            "You will learn microservices best practices, CI/CD pipelines, and cloud deployments under mentorship. "
            "We value curiosity, eagerness to learn, and collaborative mindset over years of experience."
        ),
        "required_skills": ["Python", "REST API", "PostgreSQL", "Git", "Linux basics"],
        "keywords": ["backend", "python", "rest api", "postgresql", "junior", "saas"],
    },
    {
        "id": "jd_tech_backend_mid_01",
        "title": "Mid-level Backend Engineer",
        "company": "CloudBase Solutions",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "CloudBase Solutions seeks a Mid-level Backend Engineer with 3+ years of experience. "
            "You will own end-to-end feature development, design relational and cache schemas, "
            "and mentor junior teammates. Day-to-day work involves writing Python/FastAPI services, "
            "optimizing SQL queries on PostgreSQL, integrating Redis for caching, "
            "and maintaining CI/CD on GitHub Actions. We deploy on AWS (EC2, RDS, S3). "
            "Strong understanding of REST principles, testing strategy (unit + integration), and Docker is expected."
        ),
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "AWS", "CI/CD"],
        "keywords": ["backend", "fastapi", "redis", "aws", "docker", "ci/cd", "mid-level"],
    },
    {
        "id": "jd_tech_backend_senior_01",
        "title": "Senior Backend Engineer",
        "company": "ScaleUp Fintech",
        "industry": "tech",
        "seniority": "senior",
        "description": (
            "ScaleUp Fintech is hiring a Senior Backend Engineer to architect high-throughput payment services. "
            "You will design distributed systems handling 10M+ transactions/day, lead technical roadmap discussions, "
            "and own production reliability. Required: 5+ years Python or Go, deep knowledge of PostgreSQL and Kafka, "
            "AWS production experience (EKS, Lambda, RDS), microservices architecture, API gateway patterns. "
            "You'll drive engineering best practices, participate in on-call rotations, "
            "and mentor a team of 6 engineers. Strong communication and system design skills are essential."
        ),
        "required_skills": ["Python", "Go", "Kafka", "PostgreSQL", "AWS EKS", "Microservices", "System Design"],
        "keywords": ["senior", "backend", "kafka", "distributed systems", "payment", "microservices", "eks"],
    },
    # ============================================================
    # TECH - FRONTEND
    # ============================================================
    {
        "id": "jd_tech_frontend_junior_01",
        "title": "Junior Frontend Developer",
        "company": "PixelBridge Studio",
        "industry": "tech",
        "seniority": "junior",
        "description": (
            "PixelBridge Studio is looking for a passionate Junior Frontend Developer. "
            "You will build responsive UI components in React, collaborate with designers on Figma specs, "
            "write clean HTML/CSS/JavaScript, and fix cross-browser compatibility issues. "
            "Basic understanding of REST API integration and version control with Git is required. "
            "We provide structured onboarding, code reviews, and weekly knowledge-sharing sessions."
        ),
        "required_skills": ["React", "JavaScript", "HTML", "CSS", "Git", "REST API integration"],
        "keywords": ["frontend", "react", "javascript", "html", "css", "junior", "ui"],
    },
    {
        "id": "jd_tech_frontend_mid_01",
        "title": "Frontend Engineer",
        "company": "Omni Commerce",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "Omni Commerce seeks a Frontend Engineer with 2-4 years experience to lead UI development "
            "for our e-commerce platform serving 500K users. You will build performant React/Next.js pages, "
            "implement state management with Zustand, integrate GraphQL APIs, write Cypress E2E tests, "
            "and optimize Core Web Vitals. TypeScript proficiency and familiarity with design systems "
            "(Tailwind CSS or MUI) required. Experience with SSR/SSG strategies is a strong plus."
        ),
        "required_skills": ["React", "Next.js", "TypeScript", "GraphQL", "Zustand", "Tailwind CSS", "Cypress"],
        "keywords": ["frontend", "react", "nextjs", "typescript", "graphql", "ssr", "e-commerce"],
    },
    {
        "id": "jd_tech_frontend_senior_01",
        "title": "Senior Frontend Engineer",
        "company": "DataViz Pro",
        "industry": "tech",
        "seniority": "senior",
        "description": (
            "DataViz Pro is hiring a Senior Frontend Engineer to own our analytics dashboard product. "
            "You will architect component libraries, establish frontend coding standards, "
            "lead performance optimization initiatives (LCP < 2s, CLS < 0.1), "
            "and mentor a team of 4 junior/mid engineers. "
            "Required: 5+ years React, deep TypeScript expertise, D3.js or similar data-visualization library, "
            "micro-frontend architecture experience, and strong understanding of browser rendering pipeline."
        ),
        "required_skills": ["React", "TypeScript", "D3.js", "Micro-frontend", "Performance Optimization"],
        "keywords": ["senior", "frontend", "react", "typescript", "d3", "analytics", "dashboard"],
    },
    # ============================================================
    # TECH - FULLSTACK
    # ============================================================
    {
        "id": "jd_tech_fullstack_junior_01",
        "title": "Junior Full Stack Developer",
        "company": "AppForge Labs",
        "industry": "tech",
        "seniority": "junior",
        "description": (
            "AppForge Labs is looking for a Junior Full Stack Developer to help build web applications "
            "from front to back. You will work on React frontends and Node.js/Express backends, "
            "write database queries in PostgreSQL, and participate in agile sprints. "
            "A basic understanding of REST APIs, Git workflow, and willingness to learn DevOps basics are required."
        ),
        "required_skills": ["React", "Node.js", "Express", "PostgreSQL", "Git"],
        "keywords": ["fullstack", "react", "nodejs", "express", "postgresql", "junior"],
    },
    {
        "id": "jd_tech_fullstack_senior_01",
        "title": "Senior Full Stack Engineer",
        "company": "HealthTech Ventures",
        "industry": "tech",
        "seniority": "senior",
        "description": (
            "HealthTech Ventures needs a Senior Full Stack Engineer to build patient-facing web portals. "
            "You will own both React (TypeScript) frontend and Python (Django) backend, "
            "design PostgreSQL schemas for healthcare data, ensure HIPAA compliance in data handling, "
            "implement JWT authentication, and deploy on AWS. "
            "Required: 5+ years full stack experience, strong testing culture (pytest, Jest), "
            "CI/CD pipeline management, and experience with healthcare or regulated industries preferred."
        ),
        "required_skills": ["React", "TypeScript", "Python", "Django", "PostgreSQL", "AWS", "JWT", "pytest"],
        "keywords": ["fullstack", "react", "django", "hipaa", "healthcare", "aws", "senior"],
    },
    # ============================================================
    # TECH - DATA / ML
    # ============================================================
    {
        "id": "jd_tech_data_junior_01",
        "title": "Junior Data Analyst",
        "company": "Insight Analytics",
        "industry": "tech",
        "seniority": "junior",
        "description": (
            "Insight Analytics is hiring a Junior Data Analyst to support business intelligence initiatives. "
            "You will write SQL queries to extract insights, build dashboards in Tableau or Power BI, "
            "clean datasets with Python (pandas), and present findings to stakeholders. "
            "Strong analytical thinking, attention to detail, and communication skills are essential."
        ),
        "required_skills": ["SQL", "Python", "pandas", "Tableau", "Power BI", "Excel"],
        "keywords": ["data analyst", "sql", "tableau", "powerbi", "pandas", "junior", "bi"],
    },
    {
        "id": "jd_tech_data_mid_01",
        "title": "Data Engineer",
        "company": "StreamFlow Data",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "StreamFlow Data seeks a Data Engineer with 3+ years experience to build and maintain "
            "scalable ETL pipelines processing 50TB/day. You will design data models in Snowflake, "
            "orchestrate workflows with Airflow, write Spark jobs for batch processing, "
            "and implement data quality checks. Strong Python and SQL skills required; "
            "experience with dbt, Kafka, or Delta Lake is a plus."
        ),
        "required_skills": ["Python", "SQL", "Airflow", "Spark", "Snowflake", "ETL"],
        "keywords": ["data engineer", "etl", "airflow", "spark", "snowflake", "pipeline"],
    },
    {
        "id": "jd_tech_ml_senior_01",
        "title": "Senior ML Engineer",
        "company": "NeuralPath AI",
        "industry": "tech",
        "seniority": "senior",
        "description": (
            "NeuralPath AI is looking for a Senior ML Engineer to productionize large-scale ML models. "
            "You will train and fine-tune LLMs/transformers, build MLOps pipelines (MLflow, Kubeflow), "
            "serve models via FastAPI endpoints, optimize inference latency, and collaborate with research scientists. "
            "Required: 5+ years Python, deep knowledge of PyTorch or TensorFlow, experience with GPU clusters (CUDA), "
            "MLOps tooling, and distributed training. Publications or open-source contributions are a plus."
        ),
        "required_skills": ["Python", "PyTorch", "LLM", "MLflow", "Kubeflow", "CUDA", "FastAPI"],
        "keywords": ["ml engineer", "pytorch", "llm", "mlops", "gpu", "transformer", "senior"],
    },
    # ============================================================
    # TECH - DEVOPS / CLOUD
    # ============================================================
    {
        "id": "jd_tech_devops_mid_01",
        "title": "DevOps Engineer",
        "company": "InfraCloud Vietnam",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "InfraCloud Vietnam is hiring a DevOps Engineer to own cloud infrastructure and delivery pipelines. "
            "Responsibilities: manage AWS infrastructure with Terraform, configure Kubernetes clusters (EKS), "
            "build GitHub Actions CI/CD pipelines, implement monitoring with Prometheus/Grafana, "
            "and maintain security best practices. "
            "Required: 3+ years DevOps/SRE, Linux administration, Docker, Helm, and scripting (Bash/Python)."
        ),
        "required_skills": ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Prometheus", "Bash"],
        "keywords": ["devops", "aws", "terraform", "kubernetes", "cicd", "prometheus", "sre"],
    },
    {
        "id": "jd_tech_devops_senior_01",
        "title": "Senior Site Reliability Engineer",
        "company": "GlobalEdge Systems",
        "industry": "tech",
        "seniority": "senior",
        "description": (
            "GlobalEdge Systems seeks a Senior SRE to drive reliability, scalability, and performance "
            "of our multi-region platform (99.99% SLA). You will define SLOs/SLIs, lead incident response, "
            "architect self-healing systems with Kubernetes operators, implement chaos engineering, "
            "and build internal developer platforms. Required: 6+ years SRE/DevOps, "
            "multi-cloud (AWS + GCP), advanced Kubernetes, Go or Python automation, "
            "strong observability stack (OpenTelemetry, Jaeger, Datadog)."
        ),
        "required_skills": ["Kubernetes", "AWS", "GCP", "Go", "Python", "OpenTelemetry", "Chaos Engineering"],
        "keywords": ["sre", "reliability", "kubernetes", "multicloud", "slo", "observability", "senior"],
    },
    # ============================================================
    # MARKETING
    # ============================================================
    {
        "id": "jd_marketing_junior_01",
        "title": "Junior Digital Marketing Executive",
        "company": "BrandBoost Agency",
        "industry": "marketing",
        "seniority": "junior",
        "description": (
            "BrandBoost Agency is hiring a Junior Digital Marketing Executive to support multi-channel campaigns. "
            "You will schedule social media posts, assist with Google/Meta Ads setup, "
            "compile weekly performance reports, and support email marketing via Mailchimp. "
            "Strong written communication, basic knowledge of analytics (Google Analytics 4) required."
        ),
        "required_skills": ["Social Media", "Google Analytics", "Meta Ads", "Mailchimp", "Content Writing"],
        "keywords": ["digital marketing", "social media", "google ads", "meta ads", "junior", "email marketing"],
    },
    {
        "id": "jd_marketing_mid_01",
        "title": "Growth Marketing Manager",
        "company": "Sprout Commerce",
        "industry": "marketing",
        "seniority": "mid",
        "description": (
            "Sprout Commerce is seeking a Growth Marketing Manager with 3+ years experience to own user acquisition. "
            "You will plan and execute paid campaigns (Google Ads, Meta, TikTok), run A/B tests, "
            "analyze funnel metrics, manage a $50K/month budget, and collaborate with content and product teams. "
            "Required: strong analytical skills, GA4, Mixpanel, SQL basics, and experience scaling ROAS profitably."
        ),
        "required_skills": ["Google Ads", "Meta Ads", "A/B Testing", "GA4", "Mixpanel", "SQL", "Budget Management"],
        "keywords": ["growth marketing", "paid ads", "roas", "a/b test", "funnel", "acquisition"],
    },
    {
        "id": "jd_marketing_senior_01",
        "title": "Head of Marketing",
        "company": "Nexus EdTech",
        "industry": "marketing",
        "seniority": "senior",
        "description": (
            "Nexus EdTech is hiring a Head of Marketing to lead brand strategy and revenue growth. "
            "You will build and manage a 10-person marketing team, own $500K annual budget, "
            "define go-to-market strategy for new product launches, develop brand guidelines, "
            "and report directly to the CEO. Required: 7+ years marketing leadership, "
            "B2C experience in edtech or SaaS, strong data-driven decision making, "
            "and demonstrated track record of scaling user base 3x+."
        ),
        "required_skills": ["Marketing Strategy", "Brand Management", "Team Leadership", "GTM", "Budget Planning"],
        "keywords": ["head of marketing", "brand strategy", "leadership", "edtech", "gtm", "senior"],
    },
    # ============================================================
    # FINANCE
    # ============================================================
    {
        "id": "jd_finance_junior_01",
        "title": "Junior Financial Analyst",
        "company": "Capital Bridge Corp",
        "industry": "finance",
        "seniority": "junior",
        "description": (
            "Capital Bridge Corp is looking for a Junior Financial Analyst to support FP&A activities. "
            "You will build financial models in Excel, prepare monthly variance reports, "
            "reconcile balance sheets, and assist in budget consolidation. "
            "Strong Excel skills, understanding of accounting principles, and CFA Level 1 progress preferred."
        ),
        "required_skills": ["Excel", "Financial Modeling", "Accounting", "FP&A", "PowerPoint"],
        "keywords": ["financial analyst", "excel", "fpa", "financial modeling", "junior", "accounting"],
    },
    {
        "id": "jd_finance_mid_01",
        "title": "Senior Financial Analyst",
        "company": "Meridian Capital",
        "industry": "finance",
        "seniority": "mid",
        "description": (
            "Meridian Capital seeks a Senior Financial Analyst with 4+ years in investment banking or PE. "
            "You will lead DCF, LBO, and M&A financial models, prepare investor presentations, "
            "conduct industry benchmarking, and support deal execution. "
            "CFA charterholder or progress required; Bloomberg and Capital IQ proficiency expected."
        ),
        "required_skills": ["DCF", "LBO Modeling", "M&A", "Bloomberg", "Capital IQ", "CFA", "Excel"],
        "keywords": ["financial analyst", "dcf", "lbo", "investment banking", "cfa", "bloomberg"],
    },
    {
        "id": "jd_finance_senior_01",
        "title": "Chief Financial Officer",
        "company": "VietGrow Holdings",
        "industry": "finance",
        "seniority": "senior",
        "description": (
            "VietGrow Holdings seeks a CFO to lead all financial operations for a $50M revenue group. "
            "Responsibilities: financial reporting, investor relations, fundraising strategy, "
            "cash flow management, tax planning, and M&A due diligence. "
            "Required: 10+ years finance leadership (Big 4 background preferred), "
            "CPA or CFA, experience with Vietnam regulatory environment, "
            "and prior CFO or VP Finance role in a growth-stage company."
        ),
        "required_skills": ["Financial Reporting", "Fundraising", "M&A", "Cash Flow", "CPA", "Investor Relations"],
        "keywords": ["cfo", "finance leadership", "fundraising", "investor relations", "vietnam", "senior"],
    },
    # ============================================================
    # DESIGN / UX
    # ============================================================
    {
        "id": "jd_design_junior_01",
        "title": "Junior UI/UX Designer",
        "company": "Creative Labs VN",
        "industry": "design",
        "seniority": "junior",
        "description": (
            "Creative Labs VN is hiring a Junior UI/UX Designer to support product design. "
            "You will create wireframes and prototypes in Figma, conduct user interviews, "
            "assist in usability testing, and collaborate with developers to hand off design specs. "
            "Portfolio demonstrating strong visual design sense and user-centered thinking required."
        ),
        "required_skills": ["Figma", "Wireframing", "Prototyping", "User Research", "Visual Design"],
        "keywords": ["ui/ux", "figma", "wireframe", "prototype", "user research", "junior", "design"],
    },
    {
        "id": "jd_design_senior_01",
        "title": "Senior Product Designer",
        "company": "Zenith Product Studio",
        "industry": "design",
        "seniority": "senior",
        "description": (
            "Zenith Product Studio needs a Senior Product Designer to lead end-to-end design for B2B SaaS. "
            "You will own design system, run design sprints, conduct generative research, "
            "define information architecture, and collaborate closely with PMs and engineers. "
            "Required: 5+ years product design, Figma expertise, experience designing complex data-heavy interfaces, "
            "accessibility knowledge (WCAG 2.1), and proven ability to align design decisions with business outcomes."
        ),
        "required_skills": ["Figma", "Design System", "Design Sprint", "User Research", "Accessibility", "Information Architecture"],
        "keywords": ["senior product designer", "design system", "b2b saas", "wcag", "figma", "ux research"],
    },
    # ============================================================
    # PRODUCT MANAGEMENT
    # ============================================================
    {
        "id": "jd_product_junior_01",
        "title": "Associate Product Manager",
        "company": "LaunchPad Ventures",
        "industry": "product",
        "seniority": "junior",
        "description": (
            "LaunchPad Ventures seeks an Associate PM eager to learn product craft. "
            "You will write user stories, maintain the product backlog in Jira, "
            "coordinate sprint ceremonies, gather user feedback, and analyze feature metrics in Amplitude. "
            "Strong communication, structured thinking, and technical curiosity are key. "
            "Engineering or business background with prior internship experience preferred."
        ),
        "required_skills": ["Jira", "User Stories", "Agile/Scrum", "Amplitude", "Stakeholder Communication"],
        "keywords": ["associate pm", "product manager", "jira", "agile", "scrum", "user stories", "junior"],
    },
    {
        "id": "jd_product_senior_01",
        "title": "Senior Product Manager",
        "company": "OmniSaaS Platform",
        "industry": "product",
        "seniority": "senior",
        "description": (
            "OmniSaaS Platform is hiring a Senior PM to own the core platform product line ($10M ARR). "
            "You will define product vision, prioritize roadmap, align cross-functional teams (Engineering, Design, Sales), "
            "run continuous discovery, and drive 0→1 features to market. "
            "Required: 5+ years PM experience in B2B SaaS, strong data-driven decision making (SQL, Looker), "
            "experience with enterprise customers, and track record shipping products that moved key metrics."
        ),
        "required_skills": ["Product Strategy", "Roadmapping", "SQL", "Looker", "Stakeholder Management", "B2B SaaS"],
        "keywords": ["senior pm", "product strategy", "b2b saas", "roadmap", "sql", "enterprise"],
    },
    # ============================================================
    # SALES
    # ============================================================
    {
        "id": "jd_sales_junior_01",
        "title": "Sales Development Representative",
        "company": "LeadGen Solutions",
        "industry": "sales",
        "seniority": "junior",
        "description": (
            "LeadGen Solutions is hiring an SDR to prospect and qualify B2B leads. "
            "You will execute outbound sequences (email + LinkedIn + cold call), "
            "book discovery calls for Account Executives, maintain CRM data in Salesforce, "
            "and hit monthly pipeline targets. "
            "Strong communication, resilience, and coachability are essential. Prior sales experience a plus."
        ),
        "required_skills": ["Cold Calling", "LinkedIn Outreach", "Salesforce", "Email Sequencing", "CRM"],
        "keywords": ["sdr", "sales development", "outbound", "salesforce", "b2b", "cold call", "junior"],
    },
    {
        "id": "jd_sales_senior_01",
        "title": "Enterprise Account Executive",
        "company": "SkyBridge SaaS",
        "industry": "sales",
        "seniority": "senior",
        "description": (
            "SkyBridge SaaS is seeking an Enterprise Account Executive to close $500K+ deals. "
            "You will manage complex 6-12 month sales cycles, navigate multi-stakeholder organizations, "
            "deliver compelling product demos, negotiate commercial terms, "
            "and consistently exceed $2M+ annual quota. "
            "Required: 7+ years enterprise B2B SaaS sales, MEDDIC or MEDDPICC methodology, "
            "executive presence, and experience selling to C-suite in Fortune 500 companies."
        ),
        "required_skills": ["Enterprise Sales", "MEDDIC", "Salesforce", "Contract Negotiation", "Executive Selling"],
        "keywords": ["enterprise ae", "account executive", "meddic", "b2b saas", "quota", "senior"],
    },
    # ============================================================
    # HUMAN RESOURCES
    # ============================================================
    {
        "id": "jd_hr_mid_01",
        "title": "HR Business Partner",
        "company": "PeopleFirst Group",
        "industry": "hr",
        "seniority": "mid",
        "description": (
            "PeopleFirst Group is hiring an HRBP to partner with tech division (200 headcount). "
            "Responsibilities: talent acquisition support, performance management, "
            "employee relations, organizational design, L&D program coordination, "
            "and HR data reporting in BambooHR. "
            "Required: 3+ years HRBP or generalist experience, strong labor law knowledge (Vietnam), "
            "and excellent interpersonal skills."
        ),
        "required_skills": ["Talent Acquisition", "Performance Management", "Employee Relations", "HR Analytics", "BambooHR"],
        "keywords": ["hrbp", "hr business partner", "talent acquisition", "performance management", "vietnam"],
    },
    # ============================================================
    # CUSTOMER SUCCESS
    # ============================================================
    {
        "id": "jd_cs_mid_01",
        "title": "Customer Success Manager",
        "company": "ClientWin SaaS",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "ClientWin SaaS seeks a Customer Success Manager to own a portfolio of 80 SMB accounts ($1.5M ARR). "
            "You will drive onboarding, monitor health scores in Gainsight, "
            "proactively mitigate churn risk, identify upsell opportunities, "
            "and build strong relationships with decision-makers. "
            "Required: 3+ years CSM in SaaS, excellent communication, data storytelling skills, "
            "and experience working cross-functionally with Sales and Product."
        ),
        "required_skills": ["Customer Onboarding", "Gainsight", "Churn Prevention", "Upsell", "Account Management"],
        "keywords": ["customer success", "csm", "gainsight", "saas", "churn", "upsell", "account management"],
    },
    # ============================================================
    # SECURITY
    # ============================================================
    {
        "id": "jd_tech_security_mid_01",
        "title": "Application Security Engineer",
        "company": "SecureCore Systems",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "SecureCore Systems is hiring an AppSec Engineer to embed security into the SDLC. "
            "You will perform code reviews for vulnerabilities (OWASP Top 10), "
            "conduct threat modeling, integrate SAST/DAST tools into CI/CD, "
            "run penetration testing on web applications, and train developers on secure coding. "
            "Required: 3+ years security engineering, OSCP or CEH preferred, "
            "proficiency in Python or Go for tooling, and familiarity with cloud security (AWS IAM, Security Hub)."
        ),
        "required_skills": ["OWASP", "SAST/DAST", "Penetration Testing", "Python", "AWS Security", "Threat Modeling"],
        "keywords": ["appsec", "security", "owasp", "penetration testing", "sast", "dast", "oscp"],
    },
    # ============================================================
    # MOBILE
    # ============================================================
    {
        "id": "jd_tech_mobile_mid_01",
        "title": "Mobile Engineer (iOS/Android)",
        "company": "AppCraft Mobile",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "AppCraft Mobile seeks a Mobile Engineer for cross-platform app development. "
            "You will build and maintain React Native apps for iOS and Android, "
            "integrate REST/GraphQL APIs, write Jest unit tests, "
            "implement push notifications, and optimize app performance. "
            "Required: 3+ years mobile (React Native or Flutter), App Store/Play Store release process, "
            "familiarity with native modules when needed."
        ),
        "required_skills": ["React Native", "iOS", "Android", "TypeScript", "REST API", "Jest", "App Store"],
        "keywords": ["mobile engineer", "react native", "ios", "android", "cross-platform", "flutter"],
    },
    # ============================================================
    # BLOCKCHAIN / WEB3
    # ============================================================
    {
        "id": "jd_tech_blockchain_mid_01",
        "title": "Blockchain Developer",
        "company": "ChainVentures Labs",
        "industry": "tech",
        "seniority": "mid",
        "description": (
            "ChainVentures Labs is hiring a Blockchain Developer to build DeFi protocols. "
            "You will write and audit Solidity smart contracts, integrate with ethers.js/web3.js, "
            "implement ERC-20/ERC-721 standards, set up Hardhat testing environments, "
            "and deploy to Ethereum and Layer-2 networks (Polygon, Arbitrum). "
            "Required: 2+ years Solidity, understanding of DeFi primitives (AMMs, lending protocols), "
            "and security-first mindset."
        ),
        "required_skills": ["Solidity", "Ethereum", "ethers.js", "Hardhat", "ERC-20", "DeFi", "Polygon"],
        "keywords": ["blockchain", "solidity", "defi", "ethereum", "web3", "smart contracts", "polygon"],
    },
]
