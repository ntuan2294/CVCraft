import { test, expect } from '@playwright/test'
import { mockBackendAPI, mockAuthAsCandidate, mockAuthAsRecruiter } from './helpers'

// Regression tests for 3 fixed bugs.

test.describe('Bug regression: Apply button logic (jobs/[id]/page.tsx)', () => {
  function mockJobDetail(page: import('@playwright/test').Page, jobId = 1) {
    page.route(`**/api/jobs/${jobId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: jobId,
          title: 'Senior Developer',
          description: 'Write code.',
          requirements: 'Know code.',
          benefits: 'Good salary.',
          location: 'Remote',
          jobType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          workMode: 'REMOTE',
          salaryMin: 3000,
          salaryMax: 5000,
          salaryCurrency: 'USD',
          isSalaryVisible: true,
          vacancyCount: 2,
          status: 'OPEN',
          viewCount: 100,
          applicationCount: 10,
          skills: ['React', 'TypeScript'],
          createdAt: new Date().toISOString(),
          isBookmarked: false,
          hasApplied: false,
          company: { id: 1, name: 'TechCorp', slug: 'techcorp', isVerified: true },
          recruiter: { id: 2, fullName: 'HR Manager' },
        }),
      })
    })
  }

  test('unauthenticated user clicking Apply redirects to login', async ({ page }) => {
    await mockBackendAPI(page)
    mockJobDetail(page)
    await page.goto('/jobs/1')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Apply Now' }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('candidate clicking Apply opens the cover letter form', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsCandidate(page)
    mockJobDetail(page)
    await page.goto('/jobs/1')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Apply Now' }).click()
    // Apply form should appear (textarea + Submit Application button)
    await expect(page.getByRole('button', { name: 'Submit Application' })).toBeVisible()
  })

  test('recruiter clicking Apply does NOT open the form (should be silently ignored)', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsRecruiter(page)
    mockJobDetail(page)
    await page.goto('/jobs/1')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Apply Now' }).click()
    // The apply form should NOT appear — recruiter should not be able to apply
    await expect(page.getByRole('button', { name: 'Submit Application' })).not.toBeVisible()
    // Page should remain on job detail (no redirect to login)
    await expect(page).toHaveURL('/jobs/1')
  })
})

test.describe('Bug regression: Bookmark uses candidate profile id (candidates/page.tsx)', () => {
  test('bookmark button passes candidate.id (not userId) to the API', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsRecruiter(page)

    // Override candidate list to have a candidate with distinct id and userId
    await page.route('**/api/candidates?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{
            id: 42,        // profile ID
            userId: 99,    // user account ID — different from id
            fullName: 'Alice Dev',
            email: 'alice@dev.com',
            skills: ['React'],
            isOpenToWork: true,
            isBookmarked: false,
            profileViews: 5,
            createdAt: new Date().toISOString(),
          }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 12,
          first: true,
          last: true,
        }),
      })
    })

    let bookmarkCalledWithId: string | null = null
    await page.route('**/api/bookmarks/candidates/**', async (route) => {
      bookmarkCalledWithId = route.request().url().split('/').pop() ?? null
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/candidates')
    await page.waitForLoadState('networkidle')

    // Wait for auth state to propagate (localStorage → React state) and bookmark button to render
    const bookmarkBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M19 21"]') }).first()
    await expect(bookmarkBtn).toBeVisible({ timeout: 5000 })
    await bookmarkBtn.click()
    await page.waitForTimeout(300)

    // API should have been called with id=42 (profile ID), NOT userId=99
    expect(bookmarkCalledWithId).toBe('42')
  })
})

test.describe('Bug regression: Job status select is controlled (recruiter dashboard)', () => {
  test('job status select reflects updated status after API response', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsRecruiter(page)

    const jobs = [{
      id: 10,
      title: 'Frontend Engineer',
      description: 'Build UIs.',
      location: 'Hanoi',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      workMode: 'HYBRID',
      salaryMin: 1500,
      salaryMax: 2500,
      salaryCurrency: 'USD',
      isSalaryVisible: true,
      category: 'Technology',
      skills: [],
      vacancyCount: 1,
      status: 'OPEN',
      viewCount: 50,
      applicationCount: 5,
      createdAt: new Date().toISOString(),
      isBookmarked: false,
      hasApplied: false,
      company: { id: 1, name: 'TechCorp', slug: 'techcorp', isVerified: true },
      recruiter: { id: 2, fullName: 'HR Manager' },
    }]

    await page.route('**/api/jobs/my**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: jobs, totalElements: 1, totalPages: 1, number: 0, size: 10, first: true, last: true }),
      })
    })

    await page.route('**/api/jobs/10/status**', async (route) => {
      // Simulate status updated to PAUSED
      jobs[0].status = 'PAUSED'
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(jobs[0]) })
    })

    await page.goto('/dashboard/recruiter')
    await page.waitForLoadState('networkidle')

    const statusSelect = page.locator('select').filter({ hasText: /open|paused|closed/i }).first()
    await expect(statusSelect).toHaveValue('OPEN')

    // Change status to PAUSED
    await statusSelect.selectOption('PAUSED')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // After API refresh, the select should show PAUSED (controlled component)
    await expect(statusSelect).toHaveValue('PAUSED')
  })
})
