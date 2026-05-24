import { expect, test } from '@playwright/test'
import { clearAuth, mockAuthAsCandidate, mockCandidateApis, useEnglishLocale } from './helpers'

test.describe('Candidate Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  // ── Auth guard ─────────────────────────────────────────────────────────────

  test('redirects unauthenticated users to login', async ({ page }) => {
    await clearAuth(page)

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // ── UC-12: View CV library ─────────────────────────────────────────────────

  test('redirects a candidate from /dashboard to /dashboard/candidate and shows CV library', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard/candidate')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
    await expect(page.getByText('Java Backend CV')).toBeVisible()
    await expect(page.getByRole('button', { name: 'My CVs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible()
  })

  // ── UC-09 / UC-10: View & edit profile ────────────────────────────────────

  test('shows the profile tab with the profile editing entry point', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard/candidate')
    await page.getByRole('button', { name: 'Profile' }).click()

    await expect(page.getByText('Backend Engineer')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit Full Profile →' })).toBeVisible()
  })

  // ── UC-13: Set CV as primary ───────────────────────────────────────────────

  test('sets a secondary CV as the primary CV', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard/candidate')

    // Initial state: Java Backend CV is primary ("Remove Default" button),
    // Platform Engineer CV is not ("Set Primary" button).
    // The cards are sorted newest-first, so Platform Engineer CV appears first.
    await expect(page.getByRole('button', { name: 'Set Primary' })).toHaveCount(1)

    // Promote Platform Engineer CV to primary
    await page.getByRole('button', { name: 'Set Primary' }).click()

    // After the PATCH /api/cv-docs/:id/primary call the mock toggles:
    // Platform Engineer CV → isPrimary: true  → button: "Remove Default" + badge "Primary"
    // Java Backend CV      → isPrimary: false → button: "Set Primary"
    const platformCvTitle = page.getByRole('heading', { name: 'Platform Engineer CV' })
    await expect(platformCvTitle.locator('..').getByText('Primary')).toBeVisible()

    const javaBackendCvTitle = page.getByRole('heading', { name: 'Java Backend CV' })
    await expect(javaBackendCvTitle.locator('..').getByText('Primary')).toHaveCount(0)
  })

  // ── UC-14: Delete CV ───────────────────────────────────────────────────────

  test('deletes a CV after confirming the deletion modal', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page)

    await page.goto('/dashboard/candidate')

    // Both CVs are visible before deletion
    await expect(page.getByRole('heading', { name: 'Java Backend CV' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Platform Engineer CV' })).toBeVisible()

    // Click Delete on the first card (Platform Engineer CV — newest, shown first)
    await page.getByRole('button', { name: 'Delete' }).first().click()

    // A confirmation modal appears
    await expect(page.getByText('Delete CV')).toBeVisible()

    // Confirm deletion using the modal's "Delete" button (the destructive action)
    const deleteModal = page.locator('.fixed.inset-0.z-50')
    await deleteModal.getByRole('button', { name: 'Delete' }).click()

    // Mock removes the document; the UI should reflect the deletion
    await expect(page.getByText('CV deleted successfully')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Platform Engineer CV' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Java Backend CV' })).toBeVisible()
  })
})
