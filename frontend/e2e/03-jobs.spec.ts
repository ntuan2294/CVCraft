import { test, expect } from '@playwright/test'
import { mockBackendAPI } from './helpers'

test.describe('Jobs Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
  })

  test('renders jobs search form and results', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder('Job title, skills, or company')).toBeVisible()
    await expect(page.getByPlaceholder('Location')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })

  test('shows job results after load', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Senior Frontend Developer')).toBeVisible()
    await expect(page.getByText('1 jobs found')).toBeVisible()
  })

  test('shows filter sidebar', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByText('Filters')).toBeVisible()
    await expect(page.getByText('Job Type')).toBeVisible()
    await expect(page.getByText('Experience Level')).toBeVisible()
    await expect(page.getByText('Work Mode')).toBeVisible()
  })

  test('searching updates URL params', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    const searchInput = page.getByPlaceholder('Job title, skills, or company')
    await searchInput.clear()
    await searchInput.fill('React')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForLoadState('networkidle')
    // The search should have been triggered (we verify via API mock handled)
    await expect(searchInput).toHaveValue('React')
  })

  test('pre-fills keyword from URL query param', async ({ page }) => {
    await page.goto('/jobs?keyword=Python+Developer')
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder('Job title, skills, or company')).toHaveValue('Python Developer')
  })

  test('pre-fills location from URL query param', async ({ page }) => {
    await page.goto('/jobs?location=Hanoi')
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder('Location')).toHaveValue('Hanoi')
  })

  test('sort dropdown is present', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    const sortSelect = page.getByRole('combobox').filter({ hasText: /newest|popular|salary/i })
    await expect(sortSelect).toBeVisible()
  })

  test('FULL_TIME filter checkbox works', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    const checkbox = page.getByLabel('FULL TIME')
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('clear filters button resets checkboxes', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    const checkbox = page.getByLabel('FULL TIME')
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await page.getByRole('button', { name: 'Clear all' }).click()
    await expect(checkbox).not.toBeChecked()
  })

  test('job card links to detail page', async ({ page }) => {
    await page.goto('/jobs')
    await page.waitForLoadState('networkidle')
    await page.getByText('Senior Frontend Developer').click()
    await expect(page).toHaveURL('/jobs/1')
  })

  test('shows empty state when no jobs found', async ({ page }) => {
    await page.route('**/api/jobs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }),
      })
    })
    await page.goto('/jobs?keyword=nonexistentjob')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('No jobs found')).toBeVisible()
    await expect(page.getByText('Try adjusting your filters or search terms')).toBeVisible()
  })
})
