import { Page } from '@playwright/test'

export const BASE_URL = 'http://localhost:3000'

// Mock localStorage for auth state
export async function mockAuthAsCandidate(page: Page) {
  await page.addInitScript(() => {
    const user = { id: 1, email: 'test@example.com', fullName: 'Test User', role: 'CANDIDATE' }
    localStorage.setItem('cvcraft_token', 'mock-token')
    localStorage.setItem('cvcraft_refresh', 'mock-refresh')
    localStorage.setItem('cvcraft_user', JSON.stringify(user))
  })
}

export async function mockAuthAsRecruiter(page: Page) {
  await page.addInitScript(() => {
    const user = { id: 2, email: 'recruiter@example.com', fullName: 'Test Recruiter', role: 'RECRUITER' }
    localStorage.setItem('cvcraft_token', 'mock-token')
    localStorage.setItem('cvcraft_refresh', 'mock-refresh')
    localStorage.setItem('cvcraft_user', JSON.stringify(user))
  })
}

export async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('cvcraft_token')
    localStorage.removeItem('cvcraft_refresh')
    localStorage.removeItem('cvcraft_user')
  })
}

// Mock Java backend API responses
export async function mockBackendAPI(page: Page) {
  await page.route('**/api/jobs/featured**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          title: 'Senior Frontend Developer',
          location: 'Ho Chi Minh City',
          workMode: 'HYBRID',
          jobType: 'FULL_TIME',
          salaryMin: 2000,
          salaryMax: 3500,
          isSalaryVisible: true,
          applicationCount: 42,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          company: { id: 1, name: 'Tech Corp', isVerified: true, logoUrl: null, slug: 'tech-corp' },
        },
        {
          id: 2,
          title: 'Backend Engineer',
          location: 'Hanoi',
          workMode: 'REMOTE',
          jobType: 'FULL_TIME',
          salaryMin: 1800,
          salaryMax: 3000,
          isSalaryVisible: true,
          applicationCount: 28,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          company: { id: 2, name: 'StartupX', isVerified: false, logoUrl: null, slug: 'startupx' },
        },
      ]),
    })
  })

  await page.route('**/api/jobs/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ openJobs: 1245, totalCandidates: 8340, totalRecruiters: 312 }),
    })
  })

  await page.route('**/api/jobs?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 1,
            title: 'Senior Frontend Developer',
            location: 'Ho Chi Minh City',
            workMode: 'HYBRID',
            jobType: 'FULL_TIME',
            salaryMin: 2000,
            salaryMax: 3500,
            isSalaryVisible: true,
            applicationCount: 42,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            company: { id: 1, name: 'Tech Corp', isVerified: true, logoUrl: null, slug: 'tech-corp' },
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      }),
    })
  })

  await page.route('**/api/jobs/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(['Technology', 'Finance', 'Marketing', 'Design']),
    })
  })

  await page.route('**/api/auth/login**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}')
    if (body.email === 'candidate@test.com' && body.password === 'password123') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: 1, email: 'candidate@test.com', fullName: 'Test Candidate', role: 'CANDIDATE' },
        }),
      })
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      })
    }
  })

  await page.route('**/api/auth/register**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 99, email: body.email, fullName: body.fullName, role: body.role },
      }),
    })
  })

  await page.route('**/api/candidates/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        headline: 'Software Developer',
        skills: ['React', 'TypeScript'],
        experience: [],
        education: [],
      }),
    })
  })

  await page.route('**/api/applications/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }),
    })
  })
}
