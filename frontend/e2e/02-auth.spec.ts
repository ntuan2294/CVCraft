import { test, expect } from '@playwright/test'
import { mockBackendAPI, mockAuthAsCandidate, mockAuthAsRecruiter } from './helpers'

// Default locale is 'vi'. Button/label text is Vietnamese unless stated.
test.describe('Auth - Login', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    // Heading: "Chào mừng trở lại" (vi) or "Welcome back" (en)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    // Submit button: "Đăng nhập" (vi) or "Sign In" (en)
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login')
    // "Tạo miễn phí" (vi) / "Create one free" (en) — the link inside the form card
    await expect(page.getByRole('link', { name: /tạo miễn phí|create one free/i })).toBeVisible()
  })

  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('a[href="/auth/forgot-password"]')).toBeVisible()
  })

  test('successful login redirects to home', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill('candidate@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/')
  })

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill('wrong@email.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('login button is disabled while loading', async ({ page }) => {
    await page.route('**/api/auth/login**', async (route) => {
      await new Promise(r => setTimeout(r, 300))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: { id: 1, email: 'candidate@test.com', fullName: 'Test User', role: 'CANDIDATE' },
        }),
      })
    })
    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill('candidate@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    const btn = page.locator('button[type="submit"]')
    await btn.click()
    await expect(btn).toBeDisabled()
  })

  test('redirect query param is respected after login', async ({ page }) => {
    await page.goto('/auth/login?redirect=/jobs')
    await page.getByPlaceholder('you@example.com').fill('candidate@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/jobs')
  })
})

test.describe('Auth - Register', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendAPI(page)
  })

  test('register page renders with role selector', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('heading').first()).toBeVisible()
    // Role selector buttons (type="button", not type="submit")
    const roleButtons = page.locator('div.grid button')
    await expect(roleButtons.first()).toBeVisible()
    await expect(roleButtons.nth(1)).toBeVisible()
  })

  test('register as CANDIDATE redirects to candidate dashboard', async ({ page }) => {
    await page.goto('/auth/register')
    // First role button = CANDIDATE
    await page.locator('div.grid button').first().click()
    await page.getByPlaceholder(/Nguyễn Văn A/i).fill('Test User')
    await page.getByPlaceholder('you@example.com').fill('newuser@test.com')
    await page.getByPlaceholder(/\+84/i).fill('0912345678')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/dashboard/candidate')
  })

  test('register as RECRUITER redirects to recruiter dashboard', async ({ page }) => {
    await page.goto('/auth/register')
    // Second role button = RECRUITER
    await page.locator('div.grid button').nth(1).click()
    await page.getByPlaceholder(/Nguyễn Văn A/i).fill('Test Recruiter')
    await page.getByPlaceholder('you@example.com').fill('recruiter@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/dashboard/recruiter')
  })

  test('shows error when password too short', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByPlaceholder(/Nguyễn Văn A/i).fill('Test User')
    await page.getByPlaceholder('you@example.com').fill('newuser@test.com')
    await page.getByPlaceholder('••••••••').fill('short')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('register page has link back to login', async ({ page }) => {
    await page.goto('/auth/register')
    // Use the one inside main content (not navbar)
    await expect(page.locator('main a[href="/auth/login"], [role="main"] a[href="/auth/login"], .bg-white a[href="/auth/login"]').first()).toBeVisible()
  })

  test('role query param pre-selects RECRUITER', async ({ page }) => {
    await page.goto('/auth/register?role=RECRUITER')
    await page.waitForLoadState('networkidle')
    // RECRUITER button (2nd) should have border-blue-600 class
    await expect(page.locator('div.grid button').nth(1)).toHaveClass(/border-blue-600/)
  })
})

test.describe('Auth - Navbar state', () => {
  test('navbar shows login/register when not authenticated', async ({ page }) => {
    await mockBackendAPI(page)
    await page.goto('/')
    await expect(page.locator('nav a[href="/auth/login"]')).toBeVisible()
    await expect(page.locator('nav a[href="/auth/register"]')).toBeVisible()
  })

  test('navbar shows user first name when authenticated', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsCandidate(page)
    await page.goto('/')
    // User avatar button shows first word of fullName ("Test")
    const avatarArea = page.locator('nav button').filter({ hasText: 'Test' })
    await expect(avatarArea).toBeVisible()
  })

  test('logout clears auth and redirects to home', async ({ page }) => {
    await mockBackendAPI(page)
    await mockAuthAsCandidate(page)
    await page.goto('/')
    // Open user dropdown
    await page.locator('nav button').filter({ hasText: 'Test' }).click()
    // Click Sign Out button
    await page.locator('nav').getByRole('button', { name: /sign out|đăng xuất/i }).click()
    await expect(page).toHaveURL('/')
    // Auth links should reappear
    await expect(page.locator('nav a[href="/auth/login"]')).toBeVisible()
  })
})
