import { test, expect } from '@playwright/test'
import { mockBackendAPI, mockAuthAsCandidate, mockAuthAsRecruiter } from './helpers'

test.describe('Candidate Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsCandidate(page)
  })

  test('dashboard renders for authenticated candidate', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('shows overview, applications, profile tabs', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'overview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'applications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'profile' })).toBeVisible()
  })

  test('clicking Applications tab shows applications section', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'applications' }).click()
    await expect(page.getByText(/all applications/i)).toBeVisible()
  })

  test('Applications tab shows empty state when no applications', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'applications' }).click()
    await expect(page.getByText('No applications yet')).toBeVisible()
    // Use the specific "Browse jobs →" link inside the empty state section (not the header button)
    await expect(page.getByRole('link', { name: /browse jobs →/i })).toBeVisible()
  })

  test('clicking Profile tab shows edit profile link', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'profile' }).click()
    await expect(page.getByRole('link', { name: /edit full profile/i })).toBeVisible()
  })

  test('Build CV button links to cv/generate', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    // Match the specific "Build CV" action button in the dashboard header (not navbar/footer)
    await expect(page.getByRole('link', { name: /✨ build cv/i })).toBeVisible()
  })

  test('Browse Jobs button links to /jobs', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('a[href="/jobs"]').first()).toBeVisible()
  })
})

test.describe('Dashboard Auth Guards', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
  })

  test('unauthenticated user is redirected from candidate dashboard to login', async ({ page }) => {
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('recruiter is redirected from candidate dashboard', async ({ page }) => {
    await mockAuthAsRecruiter(page)
    await page.goto('/dashboard/candidate')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/recruiter')
  })
})
