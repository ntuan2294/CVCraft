import type { Certification, Education, Project, UserInput, WorkExperience } from '@/lib/types'
import type { CVTemplate } from '@/components/TemplatePickerModal'

export const EMPTY_EXP: WorkExperience = {
  company: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
}

export const EMPTY_EDU: Education = {
  school: '',
  degree: '',
  major: '',
  start_date: '',
  end_date: '',
}

export const EMPTY_PROJ: Project = {
  name: '',
  description: '',
  link: '',
  start_date: '',
  end_date: '',
  tech_stack: [],
}

export const EMPTY_CERT: Certification = {
  name: '',
  issuer: '',
  date: '',
  link: '',
}

export const CV_TEMPLATES: CVTemplate[] = [
  {
    id: '1',
    name: 'Template 1',
    description: 'Có ảnh, dùng nhãn Profile cho phần tóm tắt',
    summaryLabel: 'Profile',
    supportsPhotoUpload: true,
    thumbnail: '/template-images/temp1.jpg',
    fields: ['photo', 'name', 'job_title', 'profile', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '2',
    name: 'Template 2',
    description: 'Có ảnh, dùng nhãn About me cho phần tóm tắt',
    summaryLabel: 'About me',
    supportsPhotoUpload: true,
    thumbnail: '/template-images/temp2.jpg',
    fields: ['photo', 'name', 'job_title', 'about_me', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '3',
    name: 'Template 3',
    description: 'Không ảnh, dùng nhãn Profile cho phần tóm tắt',
    summaryLabel: 'Profile',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp3.jpg',
    fields: ['name', 'job_title', 'profile', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '4',
    name: 'Template 4',
    description: 'Mẫu có vùng ảnh trong file, dùng Personal summary',
    summaryLabel: 'Personal summary',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp4.jpg',
    fields: ['photo', 'name', 'job_title', 'personal_summary', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '5',
    name: 'Template 5',
    description: 'Không ảnh, dùng nhãn Summary gọn gàng',
    summaryLabel: 'Summary',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp5.jpg',
    fields: ['name', 'job_title', 'summary', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
]

export const TEMPLATE_PATH_BY_ID: Record<string, string> = {
  '1': 'template cv/1.docx',
  '2': 'template cv/2.docx',
  '3': 'template cv/3.docx',
  '4': 'template cv/4.docx',
  '5': 'template cv/5.docx',
}

export const SUMMARY_FIELD_BY_TEMPLATE: Record<string, 'profile' | 'about_me' | 'personal_summary' | 'summary'> = {
  '1': 'profile',
  '2': 'about_me',
  '3': 'profile',
  '4': 'personal_summary',
  '5': 'summary',
}

export const SAMPLE_JD_TEXT = `Java Software Engineer
TechNova Solutions

Mô tả công việc
- Phát triển và bảo trì các dịch vụ backend sử dụng Java, Spring Boot và RESTful API.
- Thiết kế database schema, tối ưu truy vấn SQL và đảm bảo hiệu năng hệ thống.
- Phối hợp với frontend, QA và DevOps để triển khai tính năng theo sprint Agile.
- Tham gia review code, viết unit test và cải thiện chất lượng hệ thống.

Yêu cầu công việc
- Có từ 3 năm kinh nghiệm phát triển backend với Java.
- Thành thạo Spring Boot, SQL, REST API và Git.
- Có kinh nghiệm với Docker, CI/CD hoặc cloud là lợi thế.
- Tư duy giải quyết vấn đề tốt, giao tiếp rõ ràng và chủ động trong công việc.

Phúc lợi
- Lương cạnh tranh, review định kỳ.
- Môi trường kỹ thuật hiện đại, có cơ hội làm việc với hệ thống scale lớn.
- Bảo hiểm, nghỉ phép và ngân sách đào tạo hàng năm.`

export const SAMPLE_USER_PROFILE: UserInput = {
  full_name: 'Nguyễn Minh Anh',
  email: 'minhanh.nguyen@example.com',
  phone: '+84 912 345 678',
  location: 'TP. Hồ Chí Minh',
  linkedin: 'linkedin.com/in/minhanh-nguyen',
  github: 'github.com/minhanhdev',
  job_title: 'Java Software Engineer',
  summary:
    'Lập trình viên backend có hơn 4 năm kinh nghiệm xây dựng REST API, xử lý dữ liệu và tối ưu hiệu năng hệ thống. Có thế mạnh về Java, Spring Boot, SQL và triển khai dịch vụ bằng Docker trong môi trường Agile.',
  work_experiences: [
    {
      company: 'FPT Software',
      position: 'Backend Developer',
      start_date: '03/2022',
      end_date: 'Hiện tại',
      description:
        'Phát triển hệ thống quản lý đơn hàng cho khách hàng thương mại điện tử với Java Spring Boot. Thiết kế REST API, tối ưu truy vấn PostgreSQL, viết unit test và phối hợp với DevOps triển khai Docker trên môi trường staging/production.',
    },
    {
      company: 'VietTech Labs',
      position: 'Junior Java Developer',
      start_date: '07/2020',
      end_date: '02/2022',
      description:
        'Xây dựng các module backend cho ứng dụng CRM nội bộ. Tích hợp API bên thứ ba, xử lý lỗi production, viết tài liệu kỹ thuật và hỗ trợ review code cho các tính năng nhỏ.',
    },
  ],
  educations: [
    {
      school: 'Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
      degree: 'Cử nhân',
      major: 'Kỹ thuật phần mềm',
      start_date: '2016',
      end_date: '2020',
      gpa: 3.45,
    },
  ],
  skills: ['Java', 'Spring Boot', 'REST API', 'PostgreSQL', 'MySQL', 'Docker', 'Git', 'JUnit', 'Agile/Scrum', 'CI/CD'],
  languages: ['Tiếng Anh - giao tiếp tốt'],
  references: 'Cung cấp khi được yêu cầu',
  certifications: [],
  projects: [],
}
