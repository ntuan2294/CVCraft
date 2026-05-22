import { expect, test } from '@playwright/test'
import { candidateUser, mockAuthApi, mockCandidateApis, useEnglishLocale } from './helpers'

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  test('renders the login page with core actions', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.locator('a[href="/auth/forgot-password"]')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create one free' })).toBeVisible()
  })

  test('logs in and respects the redirect query', async ({ page }) => {
    await mockAuthApi(page)

    await page.goto('/auth/login?redirect=/cv/generate')
    await page.getByPlaceholder('you@example.com').fill(candidateUser.email)
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL('/cv/generate')
  })

  test('shows an error on failed login', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      })
    })

    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill('wrong@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('registers a candidate and lands on the candidate dashboard', async ({ page }) => {
    await mockAuthApi(page)
    await mockCandidateApis(page)

    await page.goto('/auth/register')
    await page.locator('input[type="text"]').first().fill('New Candidate')
    await page.getByPlaceholder('you@example.com').fill('newcandidate@example.com')
    await page.locator('input[type="tel"]').fill('+84 912 345 678')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL('/dashboard/candidate')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
  })

  test('register page no longer shows any role selector', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.locator('select')).toHaveCount(0)
    await expect(page.getByText('Password must be at least 8 characters')).toHaveCount(0)
  })
})
