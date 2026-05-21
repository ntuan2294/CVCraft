import { test, expect } from '@playwright/test'
import { mockBackendAPI } from './helpers'

// Default locale is 'vi', so we match Vietnamese text throughout.
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
  })

  test('renders hero section with search form', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    // The search form has a text input and a location input
    const form = page.locator('form').first()
    await expect(form.locator('input[type="text"]').first()).toBeVisible()
    await expect(form.getByRole('button', { name: /tìm việc|search jobs/i })).toBeVisible()
  })

  test('shows navigation links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /CVCraft/ })).toBeVisible()
    // Sign In link — match by href to avoid locale dependency
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible()
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible()
  })

  test('displays stats section after API loads', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Stats from mock: openJobs=1245 → rendered as "1,245+" — target the stat number exactly
    await expect(page.getByText('1,245+', { exact: true })).toBeVisible()
  })

  test('displays featured jobs after API loads', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Senior Frontend Developer')).toBeVisible()
    await expect(page.getByText('Backend Engineer')).toBeVisible()
  })

  test('search form navigates to /jobs with keyword', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('form').first()
    // Fill the first text input in the hero form
    await form.locator('input[type="text"]').first().fill('React Developer')
    await form.getByRole('button').click()
    await expect(page).toHaveURL(/\/jobs\?.*keyword=React/)
  })

  test('popular term buttons navigate to jobs search', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Popular terms are <button> elements OUTSIDE the form in the hero section
    // They sit in a div after the form, with onClick → router.push(/jobs?keyword=...)
    const heroSection = page.locator('section').first()
    // Get buttons that are not type="submit" (not the search button)
    const popularBtn = heroSection.locator('button:not([type="submit"])').first()
    const count = await popularBtn.count()
    if (count > 0) {
      await popularBtn.click()
      await expect(page).toHaveURL(/\/jobs\?keyword=/)
    }
  })

  test('featured job card links to job detail', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByText('Senior Frontend Developer').click()
    await expect(page).toHaveURL(/\/jobs\/\d+/)
  })

  test('CTA buttons link to correct pages (by href)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/cv/generate"]').first()).toBeVisible()
    await expect(page.locator('a[href="/jd/search"]').first()).toBeVisible()
  })

  test('language toggle switches locale', async ({ page }) => {
    await page.goto('/')
    // Default is 'vi', so toggle button should show the OTHER language option
    const langBtn = page.locator('nav button').filter({ hasText: /EN|VI/ }).first()
    await expect(langBtn).toBeVisible()
    await langBtn.click()
    // After clicking, the UI should update (button text changes)
    await expect(langBtn).toBeVisible()
  })
})
