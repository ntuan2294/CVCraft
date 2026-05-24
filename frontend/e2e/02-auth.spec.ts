import { expect, test } from '@playwright/test'
import {
  candidateUser,
  mockAuthApi,
  mockCandidateApis,
  mockOtpApi,
  useEnglishLocale,
} from './helpers'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fill the 6-digit OTP input boxes one by one.
// The verify-email page auto-submits when all six digits are present.
// ─────────────────────────────────────────────────────────────────────────────
async function fillOtpInputs(page: import('@playwright/test').Page, code: string) {
  const inputs = page.locator('input[inputmode="numeric"]')
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(code[i])
  }
}

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  // ── UC-02: Render & basic login ────────────────────────────────────────────

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

  // ── UC-02 alt path: unverified email → redirect to OTP page ───────────────

  test('redirects to OTP verification when the account email is not yet verified', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Email not verified. A new OTP has been sent.' }),
      })
    })

    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill('unverified@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()

    // LoginForm checks whether the error message contains "not verified" and
    // redirects to the OTP verification page instead of showing an error banner.
    await expect(page).toHaveURL(/\/auth\/verify-email\?email=unverified/)
  })

  // ── UC-01: Registration → OTP redirect ────────────────────────────────────

  test('register page has no role selector', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.locator('select')).toHaveCount(0)
    await expect(page.getByText('Password must be at least 8 characters')).toHaveCount(0)
  })

  test('registers a candidate and redirects to email verification', async ({ page }) => {
    // The register API returns { message } (not tokens); the page always
    // routes the user to /auth/verify-email after a successful submission.
    await mockAuthApi(page)

    await page.goto('/auth/register')
    await page.locator('input[type="text"]').first().fill('New Candidate')
    await page.getByPlaceholder('you@example.com').fill('newcandidate@example.com')
    await page.locator('input[type="tel"]').fill('+84 912 345 678')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()

    // Must land on the OTP verification page (email encoded in query param)
    await expect(page).toHaveURL(/\/auth\/verify-email\?email=newcandidate/)
  })

  // ── UC-03: OTP verification ────────────────────────────────────────────────

  test('verifies email with the correct OTP and proceeds to the candidate dashboard', async ({ page }) => {
    await mockOtpApi(page)
    await mockCandidateApis(page)

    await page.goto(`/auth/verify-email?email=${encodeURIComponent(candidateUser.email)}`)

    // Fill all six digit boxes; the form auto-submits when the last digit is entered
    await fillOtpInputs(page, '123456')

    // verify-email page calls router.push('/dashboard') which then redirects
    // to /dashboard/candidate for a CANDIDATE role user
    await expect(page).toHaveURL('/dashboard/candidate')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
  })

  test('shows an error when an invalid OTP code is submitted', async ({ page }) => {
    await page.route('**/api/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid OTP code' }),
      })
    })

    await page.goto(`/auth/verify-email?email=${encodeURIComponent(candidateUser.email)}`)

    // Enter a wrong 6-digit code; auto-submit fires after the last digit
    await fillOtpInputs(page, '999999')

    await expect(page.getByText('Invalid OTP code')).toBeVisible()
    // After an error the component resets all boxes
    const inputs = page.locator('input[inputmode="numeric"]')
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue('')
    }
  })

  // ── UC-04: Resend OTP ──────────────────────────────────────────────────────

  test('allows the user to resend the OTP and shows a cooldown timer', async ({ page }) => {
    await mockOtpApi(page)

    await page.goto(`/auth/verify-email?email=${encodeURIComponent(candidateUser.email)}`)

    // Resend button is initially enabled (no previous send recorded in this session)
    const resendBtn = page.getByRole('button', { name: 'Resend' })
    await expect(resendBtn).toBeEnabled()

    await resendBtn.click()

    // After a successful resend, the server starts the 60-second cooldown
    // and the button becomes disabled while the countdown is running
    await expect(resendBtn).toBeDisabled()
  })
})
