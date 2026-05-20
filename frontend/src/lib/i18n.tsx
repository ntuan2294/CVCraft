'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Locale = 'en' | 'vi'

const translations = {
  en: {
    // Navbar
    'nav.findJobs': 'Find Jobs',
    'nav.browseTalent': 'Browse Talent',
    'nav.companies': 'Companies',
    'nav.aiCvBuilder': 'AI CV Builder',
    'nav.jdSearch': 'JD Search',
    'nav.dashboard': 'Dashboard',
    'nav.myApplications': 'My Applications',
    'nav.profileSettings': 'Profile Settings',
    'nav.signOut': 'Sign Out',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started',

    // Footer
    'footer.tagline': 'The smarter way to hire and get hired. AI-powered CV builder, job search, and talent discovery.',
    'footer.jobSeekers': 'For Job Seekers',
    'footer.browseJobs': 'Browse Jobs',
    'footer.aiCvBuilder': 'AI CV Builder',
    'footer.jdSearch': 'JD Search',
    'footer.createAccount': 'Create Account',
    'footer.forRecruiters': 'For Recruiters',
    'footer.browseCandidates': 'Browse Candidates',
    'footer.postJob': 'Post a Job',
    'footer.companyProfiles': 'Company Profiles',
    'footer.recruiterSignUp': 'Recruiter Sign Up',
    'footer.resources': 'Resources',
    'footer.aboutUs': 'About Us',
    'footer.careerBlog': 'Career Blog',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.copyright': '© 2024 CVCraft. All rights reserved.',
    'footer.poweredBy': 'Powered by AI',

    // Home - Hero
    'home.openPositions': '{n}+ open positions available',
    'home.newJobsDaily': 'New jobs added daily',
    'home.heroTitle1': 'Find Your Dream Job',
    'home.heroTitle2': 'with AI-Powered Matching',
    'home.heroDesc': 'Discover top opportunities, build a standout CV with AI, and connect with leading companies — all in one platform.',
    'home.searchPlaceholder': 'Job title, skills, or keywords',
    'home.locationPlaceholder': 'Location or Remote',
    'home.searchJobs': 'Search Jobs',
    'home.popular': 'Popular:',
    'home.popularTerms': 'Software Engineer,Data Analyst,Product Manager,UX Designer',

    // Home - Stats
    'home.openJobs': 'Open Jobs',
    'home.activeCandidates': 'Active Candidates',
    'home.companiesHiring': 'Companies Hiring',
    'home.cvsGenerated': 'CVs Generated',

    // Home - Featured Jobs
    'home.featuredJobs': 'Featured Jobs',
    'home.hotOpportunities': 'Hot opportunities from top companies',
    'home.viewAllJobs': 'View all jobs →',

    // Home - How It Works
    'home.howItWorks': 'How CVCraft Works',
    'home.getHiredFaster': 'Get hired faster with our AI-powered platform',
    'home.step': 'Step',
    'home.step1Title': 'Search & Discover',
    'home.step1Desc': 'Browse thousands of jobs with powerful filters. Find roles that match your skills and preferences.',
    'home.step2Title': 'Build Your CV with AI',
    'home.step2Desc': 'Use our AI CV builder to create a tailored, ATS-optimized resume for each application.',
    'home.step3Title': 'Apply & Get Hired',
    'home.step3Desc': 'Apply in one click, track your applications and receive updates in real-time.',

    // Home - AI Banner
    'home.aiBannerTitle': 'AI-Powered CV Builder',
    'home.aiBannerDesc': 'Generate a professional, ATS-optimized CV in minutes. Our multi-agent AI analyzes the job description and tailors your CV to maximize your chances.',
    'home.buildCvFree': 'Build My CV Free →',
    'home.searchJobDescriptions': 'Search Job Descriptions',

    // Home - Recruiter CTA
    'home.hiringTitle': 'Hiring? Find Top Talent',
    'home.hiringDesc': 'Browse thousands of qualified candidates, filter by skills and experience, shortlist the best fits for your roles.',
    'home.feature1': 'Advanced candidate filtering',
    'home.feature2': 'AI-generated CVs ready to review',
    'home.feature3': 'One-click shortlisting',
    'home.feature4': 'Integrated application tracking',
    'home.browseCandidates': 'Browse Candidates',
    'home.postJob': 'Post a Job',
    'home.timeToHire': 'Time to Hire',
    'home.timeToHireVal': '50% faster',
    'home.qualityCandidates': 'Quality Candidates',
    'home.qualityCandidatesVal': '3x more',
    'home.atsOptimized': 'ATS Optimized',
    'home.satisfactionRate': 'Satisfaction Rate',

    // Job card
    'card.applicants': '{n} applicants',
    'card.today': 'Today',
    'card.dayAgo': '1 day ago',
    'card.daysAgo': '{n}d ago',
    'card.weeksAgo': '{n}w ago',
    'card.monthsAgo': '{n}mo ago',

    // Jobs page
    'jobs.title': 'Find Your Next Job',
    'jobs.subtitle': 'Browse thousands of opportunities from top companies',
    'jobs.searchPlaceholder': 'Job title, skills, or keywords',
    'jobs.locationPlaceholder': 'City, province, or Remote',
    'jobs.search': 'Search',
    'jobs.allCategories': 'All Categories',
    'jobs.allTypes': 'All Types',
    'jobs.allLevels': 'All Levels',
    'jobs.allModes': 'All Modes',
    'jobs.sortNewest': 'Newest',
    'jobs.sortSalaryHigh': 'Salary: High to Low',
    'jobs.noResults': 'No jobs found',
    'jobs.noResultsHint': 'Try adjusting your search filters',
    'jobs.results': '{n} jobs found',
    'jobs.salaryMin': 'Min salary ($)',
    'jobs.filters': 'Filters',

    // Candidates page
    'candidates.title': 'Find Top Talent',
    'candidates.subtitle': 'Browse qualified candidates ready for your next role',
    'candidates.searchPlaceholder': 'Name, skills, or title',
    'candidates.locationPlaceholder': 'City or province',
    'candidates.search': 'Search',
    'candidates.allLevels': 'All Levels',
    'candidates.allModes': 'All Modes',
    'candidates.openToWork': 'Open to work only',
    'candidates.minExp': 'Min exp (years)',
    'candidates.maxExp': 'Max exp (years)',
    'candidates.noResults': 'No candidates found',
    'candidates.noResultsHint': 'Try adjusting your filters',

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
    'auth.joinProfessionals': 'Join thousands of professionals',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone (optional)',
    'auth.iAmA': 'I am a...',
    'auth.candidate': 'Job Seeker',
    'auth.recruiter': 'Recruiter / HR',
    'auth.passwordMin': 'Password must be at least 8 characters',
    'auth.registering': 'Creating account...',
    'auth.register': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.registrationFailed': 'Registration failed',

    // Language toggle
    'lang.toggle': 'VI',
  },

  vi: {
    // Navbar
    'nav.findJobs': 'Tìm việc làm',
    'nav.browseTalent': 'Duyệt ứng viên',
    'nav.companies': 'Công ty',
    'nav.aiCvBuilder': 'Tạo CV bằng AI',
    'nav.jdSearch': 'Tìm JD',
    'nav.dashboard': 'Bảng điều khiển',
    'nav.myApplications': 'Đơn ứng tuyển',
    'nav.profileSettings': 'Cài đặt hồ sơ',
    'nav.signOut': 'Đăng xuất',
    'nav.signIn': 'Đăng nhập',
    'nav.getStarted': 'Bắt đầu ngay',

    // Footer
    'footer.tagline': 'Nền tảng tuyển dụng thông minh. Tạo CV bằng AI, tìm kiếm việc làm và khám phá nhân tài.',
    'footer.jobSeekers': 'Dành cho ứng viên',
    'footer.browseJobs': 'Tìm việc làm',
    'footer.aiCvBuilder': 'Tạo CV bằng AI',
    'footer.jdSearch': 'Tìm kiếm JD',
    'footer.createAccount': 'Tạo tài khoản',
    'footer.forRecruiters': 'Dành cho nhà tuyển dụng',
    'footer.browseCandidates': 'Duyệt ứng viên',
    'footer.postJob': 'Đăng tin tuyển dụng',
    'footer.companyProfiles': 'Hồ sơ công ty',
    'footer.recruiterSignUp': 'Đăng ký nhà tuyển dụng',
    'footer.resources': 'Tài nguyên',
    'footer.aboutUs': 'Về chúng tôi',
    'footer.careerBlog': 'Blog nghề nghiệp',
    'footer.privacyPolicy': 'Chính sách bảo mật',
    'footer.termsOfService': 'Điều khoản dịch vụ',
    'footer.copyright': '© 2024 CVCraft. Bảo lưu mọi quyền.',
    'footer.poweredBy': 'Hỗ trợ bởi AI',

    // Home - Hero
    'home.openPositions': '{n}+ vị trí đang tuyển dụng',
    'home.newJobsDaily': 'Việc làm mới mỗi ngày',
    'home.heroTitle1': 'Tìm Công Việc Mơ Ước',
    'home.heroTitle2': 'với Công nghệ AI',
    'home.heroDesc': 'Khám phá cơ hội hàng đầu, tạo CV nổi bật với AI và kết nối với các công ty hàng đầu — tất cả trên một nền tảng.',
    'home.searchPlaceholder': 'Vị trí, kỹ năng hoặc từ khóa',
    'home.locationPlaceholder': 'Địa điểm hoặc Làm từ xa',
    'home.searchJobs': 'Tìm việc',
    'home.popular': 'Phổ biến:',
    'home.popularTerms': 'Kỹ sư phần mềm,Phân tích dữ liệu,Quản lý sản phẩm,Thiết kế UX',

    // Home - Stats
    'home.openJobs': 'Việc làm',
    'home.activeCandidates': 'Ứng viên',
    'home.companiesHiring': 'Công ty tuyển dụng',
    'home.cvsGenerated': 'CV đã tạo',

    // Home - Featured Jobs
    'home.featuredJobs': 'Việc làm nổi bật',
    'home.hotOpportunities': 'Cơ hội hấp dẫn từ các công ty hàng đầu',
    'home.viewAllJobs': 'Xem tất cả →',

    // Home - How It Works
    'home.howItWorks': 'CVCraft hoạt động thế nào?',
    'home.getHiredFaster': 'Được tuyển dụng nhanh hơn với nền tảng AI của chúng tôi',
    'home.step': 'Bước',
    'home.step1Title': 'Tìm kiếm & Khám phá',
    'home.step1Desc': 'Duyệt hàng nghìn việc làm với bộ lọc mạnh mẽ. Tìm vị trí phù hợp với kỹ năng và sở thích của bạn.',
    'home.step2Title': 'Tạo CV với AI',
    'home.step2Desc': 'Dùng AI CV Builder để tạo CV được tùy chỉnh và tối ưu ATS cho từng đơn ứng tuyển.',
    'home.step3Title': 'Ứng tuyển & Được nhận',
    'home.step3Desc': 'Ứng tuyển một chạm, theo dõi đơn và nhận cập nhật theo thời gian thực.',

    // Home - AI Banner
    'home.aiBannerTitle': 'Tạo CV bằng AI',
    'home.aiBannerDesc': 'Tạo CV chuyên nghiệp, tối ưu ATS chỉ trong vài phút. AI đa tác tử phân tích JD và tùy chỉnh CV để tối đa hóa cơ hội của bạn.',
    'home.buildCvFree': 'Tạo CV miễn phí →',
    'home.searchJobDescriptions': 'Tìm kiếm JD',

    // Home - Recruiter CTA
    'home.hiringTitle': 'Tuyển dụng? Tìm nhân tài hàng đầu',
    'home.hiringDesc': 'Duyệt hàng nghìn ứng viên chất lượng, lọc theo kỹ năng và kinh nghiệm, chọn lọc những người phù hợp nhất.',
    'home.feature1': 'Lọc ứng viên nâng cao',
    'home.feature2': 'CV tạo bởi AI sẵn sàng xem xét',
    'home.feature3': 'Chọn lọc một chạm',
    'home.feature4': 'Theo dõi đơn ứng tuyển tích hợp',
    'home.browseCandidates': 'Duyệt ứng viên',
    'home.postJob': 'Đăng tuyển',
    'home.timeToHire': 'Thời gian tuyển dụng',
    'home.timeToHireVal': 'Nhanh hơn 50%',
    'home.qualityCandidates': 'Ứng viên chất lượng',
    'home.qualityCandidatesVal': 'Tăng 3 lần',
    'home.atsOptimized': 'Tối ưu ATS',
    'home.satisfactionRate': 'Tỷ lệ hài lòng',

    // Job card
    'card.applicants': '{n} ứng viên',
    'card.today': 'Hôm nay',
    'card.dayAgo': '1 ngày trước',
    'card.daysAgo': '{n} ngày trước',
    'card.weeksAgo': '{n} tuần trước',
    'card.monthsAgo': '{n} tháng trước',

    // Jobs page
    'jobs.title': 'Tìm Việc Làm Tiếp Theo',
    'jobs.subtitle': 'Duyệt hàng nghìn cơ hội từ các công ty hàng đầu',
    'jobs.searchPlaceholder': 'Vị trí, kỹ năng hoặc từ khóa',
    'jobs.locationPlaceholder': 'Thành phố, tỉnh hoặc Làm từ xa',
    'jobs.search': 'Tìm kiếm',
    'jobs.allCategories': 'Tất cả danh mục',
    'jobs.allTypes': 'Tất cả loại',
    'jobs.allLevels': 'Tất cả cấp độ',
    'jobs.allModes': 'Tất cả hình thức',
    'jobs.sortNewest': 'Mới nhất',
    'jobs.sortSalaryHigh': 'Lương: Cao đến thấp',
    'jobs.noResults': 'Không tìm thấy việc làm',
    'jobs.noResultsHint': 'Thử điều chỉnh bộ lọc tìm kiếm',
    'jobs.results': '{n} việc làm',
    'jobs.salaryMin': 'Lương tối thiểu ($)',
    'jobs.filters': 'Bộ lọc',

    // Candidates page
    'candidates.title': 'Tìm Nhân Tài Hàng Đầu',
    'candidates.subtitle': 'Duyệt ứng viên chất lượng sẵn sàng cho vị trí của bạn',
    'candidates.searchPlaceholder': 'Tên, kỹ năng hoặc vị trí',
    'candidates.locationPlaceholder': 'Thành phố hoặc tỉnh',
    'candidates.search': 'Tìm kiếm',
    'candidates.allLevels': 'Tất cả cấp độ',
    'candidates.allModes': 'Tất cả hình thức',
    'candidates.openToWork': 'Chỉ ứng viên đang tìm việc',
    'candidates.minExp': 'Kinh nghiệm tối thiểu (năm)',
    'candidates.maxExp': 'Kinh nghiệm tối đa (năm)',
    'candidates.noResults': 'Không tìm thấy ứng viên',
    'candidates.noResultsHint': 'Thử điều chỉnh bộ lọc',

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
    'auth.joinProfessionals': 'Tham gia cùng hàng nghìn chuyên gia',
    'auth.fullName': 'Họ và tên',
    'auth.phone': 'Số điện thoại (tuỳ chọn)',
    'auth.iAmA': 'Tôi là...',
    'auth.candidate': 'Ứng viên tìm việc',
    'auth.recruiter': 'Nhà tuyển dụng / HR',
    'auth.passwordMin': 'Mật khẩu phải có ít nhất 8 ký tự',
    'auth.registering': 'Đang tạo tài khoản...',
    'auth.register': 'Tạo tài khoản',
    'auth.alreadyHaveAccount': 'Đã có tài khoản?',
    'auth.registrationFailed': 'Đăng ký thất bại',

    // Language toggle
    'lang.toggle': 'EN',
  },
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

  useEffect(() => {
    const saved = localStorage.getItem('cvcraft_locale') as Locale | null
    if (saved === 'en' || saved === 'vi') setLocaleState(saved)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('cvcraft_locale', l)
  }, [])

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    const dict = translations[locale] as Record<string, string>
    let str = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }, [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider')
  return ctx
}
