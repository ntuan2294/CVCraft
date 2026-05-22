'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type Locale = 'en' | 'vi'

const translations = {
  en: {
    // Navbar
    'nav.aiCvBuilder': 'AI CV Builder',
    'nav.jdSearch': 'JD Search',
    'nav.myCvs': 'My CVs',
    'nav.dashboard': 'Dashboard',
    'nav.buildCv': 'Build CV',
    'nav.profileSettings': 'Profile Settings',
    'nav.signOut': 'Sign Out',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started',

    // Footer
    'footer.tagline': 'The AI-powered CV builder. Create professional, ATS-optimized CVs in minutes.',
    'footer.forUsers': 'Features',
    'footer.aiCvBuilder': 'AI CV Builder',
    'footer.jdSearch': 'JD Search',
    'footer.myCvLibrary': 'My CV Library',
    'footer.createAccount': 'Create Account',
    'footer.resources': 'Resources',
    'footer.aboutUs': 'About Us',
    'footer.careerBlog': 'Career Blog',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.copyright': '© 2024 CVCraft. All rights reserved.',
    'footer.poweredBy': 'Powered by AI',

    // Home - Hero
    'home.heroBadge': 'AI-Powered CV Generator',
    'home.heroTitle1': 'Build a Professional CV',
    'home.heroTitle2': 'in Minutes with AI',
    'home.heroDesc': 'Enter a job title, let our multi-agent AI analyze the role and generate a tailored, ATS-optimized CV that gets you interviews.',
    'home.heroInputPlaceholder': 'e.g. Senior React Developer, Data Scientist...',
    'home.heroCta': 'Build My CV →',
    'home.heroNoLogin': 'No account needed to try. Free forever for basic use.',

    // Home - Stats
    'home.stat1Label': 'Professional Templates',
    'home.stat2Label': 'Data Privacy',
    'home.stat3Label': 'Generation Time',
    'home.stat4Label': 'ATS Match Rate',

    // Home - Features
    'home.featuresTitle': 'Everything You Need to Land the Job',
    'home.featuresDesc': 'Our AI-powered tools help you create a standout CV tailored to any role',
    'home.feat1Title': 'Multi-Agent AI Pipeline',
    'home.feat1Desc': 'Our specialized AI agents analyze the JD, extract skills, and craft each CV section for maximum impact.',
    'home.feat2Title': 'ATS Optimization',
    'home.feat2Desc': 'Built-in ATS scoring ensures your CV passes automated screening systems before reaching recruiters.',
    'home.feat3Title': 'Quality Scoring',
    'home.feat3Desc': 'Get detailed feedback on your CV\'s ATS score, JD match rate, and linguistic quality.',
    'home.feat4Title': 'Multiple Templates',
    'home.feat4Desc': 'Choose from 5 professionally designed templates and export to DOCX or PDF.',
    'home.feat5Title': 'JD-Tailored Content',
    'home.feat5Desc': 'Paste any job description and AI will tailor your CV specifically for that role and company.',
    'home.feat6Title': 'CV Library',
    'home.feat6Desc': 'Save multiple CV versions, mark a primary one, and manage your entire portfolio in one place.',

    // Home - How It Works
    'home.howItWorks': 'How CVCraft Works',
    'home.howItWorksDesc': 'Three simple steps to a professional, interview-ready CV',
    'home.step': 'Step',
    'home.step1Title': 'Enter Your Info & JD',
    'home.step1Desc': 'Fill in your experience, skills, and paste the job description you\'re targeting.',
    'home.step2Title': 'AI Generates Your CV',
    'home.step2Desc': 'Our multi-agent AI pipeline analyzes the JD, tailors your content, and quality-checks the result.',
    'home.step3Title': 'Download & Apply',
    'home.step3Desc': 'Export as DOCX or PDF, save to your library, and apply with confidence.',

    // Home - CTA
    'home.ctaTitle': 'Ready to Land Your Next Role?',
    'home.ctaDesc': 'Generate a professional, ATS-optimized CV in under 2 minutes. Free to try.',
    'home.ctaBuildCv': 'Build My CV Free →',
    'home.ctaJdSearch': 'Search Job Descriptions',

    // JD Search
    'jd.badge': 'AI-Powered JD Search',
    'jd.title': 'Find the Perfect Job Description',
    'jd.desc': 'Search through thousands of job descriptions using semantic AI. Get formatted, structured JDs ready for your CV generation.',
    'jd.placeholder': 'e.g. Senior React Developer, Data Scientist, Product Manager...',
    'jd.search': 'Search JDs',
    'jd.searching': 'Searching...',
    'jd.tip': 'Try searching for roles like "React Developer", "Data Engineer", or "UX Designer"',
    'jd.noResults': 'No results found',
    'jd.noResultsHint': 'Try a different search query',
    'jd.results': '{n} results found',
    'jd.error': 'Search failed. Make sure the JD Search service is running.',
    'jd.generateCv': 'Generate CV',

    // Auth - Login
    'auth.welcomeBack': 'Welcome back',
    'auth.signInToAccount': 'Sign in to your account',
    'auth.emailAddress': 'Email address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.signingIn': 'Signing in...',
    'auth.signIn': 'Sign In',
    'auth.noAccount': "Don't have an account?",
    'auth.createOneFree': 'Create one free',
    'auth.invalidCredentials': 'Invalid email or password',

    // Auth - Register
    'auth.createAccount': 'Create your account',
    'auth.joinProfessionals': 'Join thousands of CV builders',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone (optional)',
    'auth.passwordMin': 'Password must be at least 8 characters',
    'auth.registering': 'Creating account...',
    'auth.register': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.registrationFailed': 'Registration failed',

    // Language toggle
    'lang.toggle': 'VI',

    // Dashboard
    'dash.title': 'My Dashboard',
    'dash.welcome': 'Welcome back, {name}!',
    'dash.buildNewCv': 'Build New CV',
    'dash.savedCvs': 'Saved CVs',
    'dash.bestAtsScore': 'Best ATS Score',
    'dash.skillsListed': 'Skills Listed',
    'dash.profileComplete': 'Profile Complete',
    'dash.myCvs': 'My CVs',
    'dash.profile': 'Profile',
    'dash.noCvsYet': 'No CVs yet',
    'dash.noCvsDesc': 'Generate your first AI-powered CV tailored to a job description',
    'dash.buildFirstCv': '✨ Build My First CV',
    'dash.createNewCv': 'Create New CV',
    'dash.cvProfile': 'CV Profile',
    'dash.prefillHint': 'Used to pre-fill CV forms',
    'dash.editFullProfile': 'Edit Full Profile →',
    'dash.primary': 'Primary',
    'dash.template': 'Template: {id}',
    'dash.download': 'Download',
    'dash.setPrimary': 'Set Primary',
    'dash.delete': 'Delete',
    'dash.deleting': '...',
    'dash.confirmDelete': 'Delete this CV?',

    // CV Generator
    'gen.title': 'Build Your CV',
    'gen.subtitle': 'Fill in your details below and let AI design the optimal CV.',
    'gen.loadSample': 'Load Sample Profile',
    'gen.jdTitle': 'Job Description',
    'gen.jdLabel': 'Paste job description here',
    'gen.jdPlaceholder': 'Paste full JD content here...',
    'gen.template': 'CV Template',
    'gen.activeTemplate': 'Using: {name}',
    'gen.fields': 'Field: {fields}',
    'gen.selectTemplate': 'Select Template',
    'gen.selectTemplateDesc': 'Choose a template that matches your style',
    'gen.confirm': 'Confirm',
    'gen.close': 'Close',
    'gen.cvLang': 'CV Language',
    'gen.langVi': 'Vietnamese',
    'gen.langViDesc': 'Entire CV in Vietnamese',
    'gen.langEn': 'English',
    'gen.langEnDesc': 'Entire CV strictly in English',
    'gen.personal': 'Personal Information',
    'gen.fullName': 'Full Name',
    'gen.jobTitle': 'Applied Job Title',
    'gen.email': 'Email',
    'gen.phone': 'Phone Number',
    'gen.address': 'Address',
    'gen.linkedin': 'LinkedIn (optional)',
    'gen.github': 'GitHub (optional)',
    'gen.summary': 'Self Introduction',
    'gen.summaryPlaceholder': 'Short summary of yourself, experience, and career goals...',
    'gen.experience': 'Work Experience',
    'gen.company': 'Company',
    'gen.position': 'Position',
    'gen.startDate': 'Start Date',
    'gen.endDate': 'End Date',
    'gen.expDesc': 'Job Description',
    'gen.expDescPlaceholder': 'Describe your responsibilities and achievements...',
    'gen.education': 'Education',
    'gen.school': 'School/University',
    'gen.degree': 'Degree',
    'gen.major': 'Major',
    'gen.gpa': 'GPA',
    'gen.skills': 'Skills',
    'gen.skillPlaceholder': 'Enter a skill and press Enter',
    'gen.langRef': 'Languages & References',
    'gen.langLabel': 'Languages',
    'gen.langPlaceholder': 'e.g. English - IELTS 7.0',
    'gen.reference': 'References',
    'gen.referencePlaceholder': 'Reference contact info or write: Available upon request',
    'gen.certifications': 'Certifications',
    'gen.certSuffix': '(optional)',
    'gen.certPlaceholder': 'No certifications yet. Click "+ Add" to add.',
    'gen.certName': 'Certificate Name',
    'gen.certIssuer': 'Issuer',
    'gen.certDate': 'Issue Date',
    'gen.certLink': 'Verification Link',
    'gen.projects': 'Projects',
    'gen.projSuffix': '(optional)',
    'gen.projName': 'Project Name',
    'gen.projLink': 'Project Link',
    'gen.projDesc': 'Project Description',
    'gen.projDescPlaceholder': 'Short description of project, role, and results...',
    'gen.techStack': 'Tech Stack',
    'gen.techStackPlaceholder': 'React, Node.js, PostgreSQL',
    'gen.add': 'Add',
    'gen.remove': 'Remove',
    'gen.submit': 'Generate CV',
    'gen.submitting': 'Generating CV...',
    'gen.cvEditor': 'CV Editor',
    'gen.cvEditorDesc': 'Edit directly on the generated CV.',
    'gen.downloadDocx': 'Download DOCX',
    'gen.exportPdf': 'Export PDF',
    'gen.saveLibrary': 'Save to Library',
    'gen.saving': 'Saving...',
    'gen.saved': 'Saved',
    'tpl.1.name': 'Template 1',
    'tpl.1.desc': 'Has photo, uses Profile label for summary section',
    'tpl.2.name': 'Template 2',
    'tpl.2.desc': 'Has photo, uses About me label for summary section',
    'tpl.3.name': 'Template 3',
    'tpl.3.desc': 'No photo, uses Profile label for summary section',
    'tpl.4.name': 'Template 4',
    'tpl.4.desc': 'Has inline photo area, uses Personal summary label',
    'tpl.5.name': 'Template 5',
    'tpl.5.desc': 'No photo, uses compact Summary label',
  },

  vi: {
    // Navbar
    'nav.aiCvBuilder': 'Tạo CV bằng AI',
    'nav.jdSearch': 'Tìm JD',
    'nav.myCvs': 'CV của tôi',
    'nav.dashboard': 'Bảng điều khiển',
    'nav.buildCv': 'Tạo CV',
    'nav.profileSettings': 'Cài đặt hồ sơ',
    'nav.signOut': 'Đăng xuất',
    'nav.signIn': 'Đăng nhập',
    'nav.getStarted': 'Bắt đầu ngay',

    // Footer
    'footer.tagline': 'Công cụ tạo CV bằng AI. Tạo CV chuyên nghiệp, tối ưu ATS trong vài phút.',
    'footer.forUsers': 'Tính năng',
    'footer.aiCvBuilder': 'Tạo CV bằng AI',
    'footer.jdSearch': 'Tìm kiếm JD',
    'footer.myCvLibrary': 'Thư viện CV',
    'footer.createAccount': 'Tạo tài khoản',
    'footer.resources': 'Tài nguyên',
    'footer.aboutUs': 'Về chúng tôi',
    'footer.careerBlog': 'Blog nghề nghiệp',
    'footer.privacyPolicy': 'Chính sách bảo mật',
    'footer.termsOfService': 'Điều khoản dịch vụ',
    'footer.copyright': '© 2024 CVCraft. Bảo lưu mọi quyền.',
    'footer.poweredBy': 'Hỗ trợ bởi AI',

    // Home - Hero
    'home.heroBadge': 'Tạo CV bằng Multi-Agent AI',
    'home.heroTitle1': 'Tạo CV Chuyên Nghiệp',
    'home.heroTitle2': 'Chỉ Trong Vài Phút',
    'home.heroDesc': 'Nhập vị trí công việc, AI của chúng tôi sẽ phân tích yêu cầu và tạo ra CV được cá nhân hóa, tối ưu ATS giúp bạn được phỏng vấn.',
    'home.heroInputPlaceholder': 'VD: Senior React Developer, Data Scientist...',
    'home.heroCta': 'Tạo CV ngay →',
    'home.heroNoLogin': 'Không cần tài khoản để thử. Miễn phí mãi mãi cho sử dụng cơ bản.',

    // Home - Stats
    'home.stat1Label': 'Mẫu CV chuyên nghiệp',
    'home.stat2Label': 'Bảo mật thông tin',
    'home.stat3Label': 'Thời gian tạo CV',
    'home.stat4Label': 'Tỷ lệ khớp ATS',

    // Home - Features
    'home.featuresTitle': 'Tất Cả Công Cụ Bạn Cần',
    'home.featuresDesc': 'Các công cụ AI giúp bạn tạo CV nổi bật cho bất kỳ vị trí nào',
    'home.feat1Title': 'Multi-Agent AI',
    'home.feat1Desc': 'Các AI chuyên biệt phân tích JD, trích xuất kỹ năng, và tạo từng phần CV để tối đa hóa hiệu quả.',
    'home.feat2Title': 'Tối Ưu ATS',
    'home.feat2Desc': 'Chấm điểm ATS tích hợp đảm bảo CV vượt qua hệ thống sàng lọc tự động trước khi đến tay nhà tuyển dụng.',
    'home.feat3Title': 'Chấm Điểm Chất Lượng',
    'home.feat3Desc': 'Nhận phản hồi chi tiết về điểm ATS, tỷ lệ khớp JD, và chất lượng ngôn ngữ của CV.',
    'home.feat4Title': 'Nhiều Mẫu CV',
    'home.feat4Desc': 'Chọn từ 5 mẫu CV được thiết kế chuyên nghiệp và xuất ra DOCX hoặc PDF.',
    'home.feat5Title': 'Nội Dung Theo JD',
    'home.feat5Desc': 'Dán bất kỳ JD nào và AI sẽ tùy chỉnh CV của bạn cụ thể cho vị trí và công ty đó.',
    'home.feat6Title': 'Thư Viện CV',
    'home.feat6Desc': 'Lưu nhiều phiên bản CV, đánh dấu CV chính, và quản lý toàn bộ portfolio trong một nơi.',

    // Home - How It Works
    'home.howItWorks': 'CVCraft hoạt động thế nào?',
    'home.howItWorksDesc': 'Ba bước đơn giản để có CV chuyên nghiệp, sẵn sàng phỏng vấn',
    'home.step': 'Bước',
    'home.step1Title': 'Nhập Thông Tin & JD',
    'home.step1Desc': 'Điền thông tin kinh nghiệm, kỹ năng và dán mô tả công việc bạn đang nhắm tới.',
    'home.step2Title': 'AI Tạo CV',
    'home.step2Desc': 'Multi-Agent AI phân tích JD, tùy chỉnh nội dung và kiểm tra chất lượng kết quả.',
    'home.step3Title': 'Tải Xuống & Ứng Tuyển',
    'home.step3Desc': 'Xuất DOCX hoặc PDF, lưu vào thư viện, và ứng tuyển với sự tự tin.',

    // Home - CTA
    'home.ctaTitle': 'Sẵn Sàng Chinh Phục Công Việc Tiếp Theo?',
    'home.ctaDesc': 'Tạo CV chuyên nghiệp, tối ưu ATS trong dưới 2 phút. Miễn phí để thử.',
    'home.ctaBuildCv': 'Tạo CV miễn phí →',
    'home.ctaJdSearch': 'Tìm kiếm JD',

    // JD Search
    'jd.badge': 'Tìm JD bằng AI',
    'jd.title': 'Tìm Mô Tả Công Việc Phù Hợp',
    'jd.desc': 'Tìm kiếm hàng nghìn mô tả công việc bằng AI ngữ nghĩa. Nhận JD đã được định dạng, sẵn sàng để tạo CV.',
    'jd.placeholder': 'VD: Lập trình viên React Senior, Khoa học dữ liệu, Quản lý sản phẩm...',
    'jd.search': 'Tìm JD',
    'jd.searching': 'Đang tìm...',
    'jd.tip': 'Thử tìm kiếm các vai trò như "React Developer", "Data Engineer" hoặc "UX Designer"',
    'jd.noResults': 'Không tìm thấy kết quả',
    'jd.noResultsHint': 'Thử từ khóa tìm kiếm khác',
    'jd.results': '{n} kết quả',
    'jd.error': 'Tìm kiếm thất bại. Hãy đảm bảo dịch vụ JD Search đang chạy.',
    'jd.generateCv': 'Tạo CV theo JD',

    // Auth - Login
    'auth.welcomeBack': 'Chào mừng trở lại',
    'auth.signInToAccount': 'Đăng nhập vào tài khoản của bạn',
    'auth.emailAddress': 'Địa chỉ email',
    'auth.password': 'Mật khẩu',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.signingIn': 'Đang đăng nhập...',
    'auth.signIn': 'Đăng nhập',
    'auth.noAccount': 'Chưa có tài khoản?',
    'auth.createOneFree': 'Tạo miễn phí',
    'auth.invalidCredentials': 'Email hoặc mật khẩu không đúng',

    // Auth - Register
    'auth.createAccount': 'Tạo tài khoản của bạn',
    'auth.joinProfessionals': 'Tham gia cùng hàng nghìn người dùng CVCraft',
    'auth.fullName': 'Họ và tên',
    'auth.phone': 'Số điện thoại (tuỳ chọn)',
    'auth.passwordMin': 'Mật khẩu phải có ít nhất 8 ký tự',
    'auth.registering': 'Đang tạo tài khoản...',
    'auth.register': 'Tạo tài khoản',
    'auth.alreadyHaveAccount': 'Đã có tài khoản?',
    'auth.registrationFailed': 'Đăng ký thất bại',

    // Language toggle
    'lang.toggle': 'EN',

    // Dashboard
    'dash.title': 'Bảng điều khiển',
    'dash.welcome': 'Chào mừng trở lại, {name}!',
    'dash.buildNewCv': 'Tạo CV mới',
    'dash.savedCvs': 'CV đã lưu',
    'dash.bestAtsScore': 'Điểm ATS cao nhất',
    'dash.skillsListed': 'Kỹ năng đã liệt kê',
    'dash.profileComplete': 'Hoàn thiện hồ sơ',
    'dash.myCvs': 'CV của tôi',
    'dash.profile': 'Hồ sơ',
    'dash.noCvsYet': 'Chưa có CV nào',
    'dash.noCvsDesc': 'Tạo CV đầu tiên được hỗ trợ bởi AI và tùy chỉnh theo mô tả công việc',
    'dash.buildFirstCv': '✨ Tạo CV đầu tiên của tôi',
    'dash.createNewCv': 'Tạo CV mới',
    'dash.cvProfile': 'Thông tin CV',
    'dash.prefillHint': 'Được dùng để tự động điền các biểu mẫu CV',
    'dash.editFullProfile': 'Chỉnh sửa toàn bộ hồ sơ →',
    'dash.primary': 'Mặc định',
    'dash.template': 'Mẫu: {id}',
    'dash.download': 'Tải xuống',
    'dash.setPrimary': 'Đặt làm mặc định',
    'dash.delete': 'Xóa',
    'dash.deleting': '...',
    'dash.confirmDelete': 'Bạn có chắc chắn muốn xóa CV này không?',

    // CV Generator
    'gen.title': 'Tạo CV của bạn',
    'gen.subtitle': 'Điền thông tin chi tiết dưới đây và để AI thiết kế bản CV tối ưu nhất.',
    'gen.loadSample': 'Điền dữ liệu mẫu',
    'gen.jdTitle': 'Mô tả công việc',
    'gen.jdLabel': 'Dán mô tả công việc vào đây',
    'gen.jdPlaceholder': 'Dán nội dung JD đầy đủ vào đây…',
    'gen.template': 'Mẫu CV',
    'gen.activeTemplate': 'Đang dùng: {name}',
    'gen.fields': 'Lĩnh vực: {fields}',
    'gen.selectTemplate': 'Chọn mẫu',
    'gen.selectTemplateDesc': 'Chọn mẫu phù hợp với phong cách của bạn',
    'gen.confirm': 'Xác nhận',
    'gen.close': 'Đóng',
    'gen.cvLang': 'Ngôn ngữ CV',
    'gen.langVi': 'Tiếng Việt',
    'gen.langViDesc': 'Toàn bộ CV bằng tiếng Việt',
    'gen.langEn': 'English',
    'gen.langEnDesc': 'All CV content strictly in English',
    'gen.personal': 'Thông tin cá nhân',
    'gen.fullName': 'Họ và tên',
    'gen.jobTitle': 'Chức danh ứng tuyển',
    'gen.email': 'Email',
    'gen.phone': 'Số điện thoại',
    'gen.address': 'Địa chỉ',
    'gen.linkedin': 'LinkedIn (không bắt buộc)',
    'gen.github': 'GitHub (không bắt buộc)',
    'gen.summary': 'Giới thiệu bản thân',
    'gen.summaryPlaceholder': 'Tóm tắt ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp…',
    'gen.experience': 'Kinh nghiệm làm việc',
    'gen.company': 'Công ty',
    'gen.position': 'Vị trí',
    'gen.startDate': 'Ngày bắt đầu',
    'gen.endDate': 'Ngày kết thúc',
    'gen.expDesc': 'Mô tả công việc',
    'gen.expDescPlaceholder': 'Mô tả trách nhiệm và thành tích của bạn…',
    'gen.education': 'Học vấn',
    'gen.school': 'Trường',
    'gen.degree': 'Bằng cấp',
    'gen.major': 'Chuyên ngành',
    'gen.gpa': 'GPA',
    'gen.skills': 'Kỹ năng',
    'gen.skillPlaceholder': 'Nhập kỹ năng rồi nhấn Enter',
    'gen.langRef': 'Ngôn ngữ & tham chiếu',
    'gen.langLabel': 'Ngôn ngữ',
    'gen.langPlaceholder': 'Ví dụ: Tiếng Anh - IELTS 7.0',
    'gen.reference': 'Reference',
    'gen.referencePlaceholder': 'Thông tin người tham chiếu hoặc ghi: Cung cấp khi được yêu cầu',
    'gen.certifications': 'Chứng chỉ',
    'gen.certSuffix': '(không bắt buộc)',
    'gen.certPlaceholder': 'Chưa có chứng chỉ nào. Nhấn "+ Thêm" để thêm.',
    'gen.certName': 'Tên chứng chỉ',
    'gen.certIssuer': 'Tổ chức cấp',
    'gen.certDate': 'Ngày cấp',
    'gen.certLink': 'Link xác minh',
    'gen.projects': 'Dự án',
    'gen.projSuffix': '(không bắt buộc)',
    'gen.projName': 'Tên dự án',
    'gen.projLink': 'Link dự án',
    'gen.projDesc': 'Mô tả dự án',
    'gen.projDescPlaceholder': 'Mô tả ngắn về dự án, vai trò và kết quả đạt được…',
    'gen.techStack': 'Công nghệ sử dụng',
    'gen.techStackPlaceholder': 'React, Node.js, PostgreSQL',
    'gen.add': 'Thêm',
    'gen.remove': 'Xóa',
    'gen.submit': 'Tạo CV',
    'gen.submitting': 'Đang tạo CV...',
    'gen.cvEditor': 'CV editor',
    'gen.cvEditorDesc': 'Chỉnh trực tiếp trên CV đã được sinh.',
    'gen.downloadDocx': 'Tải DOCX',
    'gen.exportPdf': 'Xuất PDF',
    'gen.saveLibrary': 'Lưu vào thư viện',
    'gen.saving': 'Đang lưu...',
    'gen.saved': 'Đã lưu',
    'tpl.1.name': 'Mẫu 1',
    'tpl.1.desc': 'Có ảnh, dùng nhãn Profile cho phần tóm tắt',
    'tpl.2.name': 'Mẫu 2',
    'tpl.2.desc': 'Có ảnh, dùng nhãn About me cho phần tóm tắt',
    'tpl.3.name': 'Mẫu 3',
    'tpl.3.desc': 'Không ảnh, dùng nhãn Profile cho phần tóm tắt',
    'tpl.4.name': 'Mẫu 4',
    'tpl.4.desc': 'Mẫu có vùng ảnh trong file, dùng Personal summary',
    'tpl.5.name': 'Mẫu 5',
    'tpl.5.desc': 'Không ảnh, dùng nhãn Summary gọn gàng',
  }
} as const

type TranslationKey = keyof typeof translations.en

interface I18nContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cvcraft_locale') as Locale | null
    if (saved === 'en' || saved === 'vi') setLocaleState(saved)
    setMounted(true)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('cvcraft_locale', l)
  }, [])

  // Before mount, always use 'vi' so server and first client render match
  const activeLocale: Locale = mounted ? locale : 'vi'

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    const dict = translations[activeLocale] as Record<string, string>
    let str = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }, [activeLocale])

  const value = useMemo(
    () => ({ locale: activeLocale, setLocale, t }),
    [activeLocale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider')
  return ctx
}
