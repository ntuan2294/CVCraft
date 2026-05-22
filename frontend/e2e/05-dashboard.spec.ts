import { expect, test } from '@playwright/test'
import { clearAuth, mockAuthAsCandidate, mockCandidateApis, useEnglishLocale } from './helpers'

test.describe('Candidate Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await clearAuth(page)

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('redirects a candidate from /dashboard to /dashboard/candidate', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard/candidate')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
    await expect(page.getByText('Java Backend CV')).toBeVisible()
    await expect(page.getByRole('button', { name: 'My CVs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible()
  })

  test('shows the profile tab with the profile editing entry point', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard/candidate')
    await page.getByRole('button', { name: 'Profile' }).click()

    await expect(page.getByText('Backend Engineer')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit Full Profile →' })).toBeVisible()
  })
})
