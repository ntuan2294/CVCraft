import { expect, test } from '@playwright/test'
import { mockAuthAsCandidate, mockCandidateApis, mockCvGenerationApi, useEnglishLocale } from './helpers'

test.describe('CV Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  test('loads the sample profile into the current form', async ({ page }) => {
    await page.goto('/cv/generate')
    await page.getByRole('button', { name: 'Load Sample Profile' }).click()

    const personalSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Personal Information' }) })
    const skillsSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Skills' }) })

    await expect(page.getByPlaceholder('Paste full JD content here...')).toHaveValue(/Java Software Engineer/)
    await expect(personalSection.locator('input').first()).toHaveValue(/Minh Anh/)
    await expect(personalSection.locator('input[type="email"]')).toHaveValue('minhanh.nguyen@example.com')
    await expect(skillsSection.getByText('Spring Boot')).toBeVisible()
  })

  test('generates a CV asynchronously and saves it to the library', async ({ page }) => {
    await mockAuthAsCandidate(page)
    await mockCandidateApis(page, { cvs: [] })
    await mockCvGenerationApi(page)

    await page.goto('/cv/generate')
    await page.getByRole('button', { name: 'Load Sample Profile' }).click()
    await page.getByRole('button', { name: 'Generate CV' }).click()

    await expect(page.getByRole('heading', { name: 'CV Editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download DOCX' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible()

    await page.getByRole('button', { name: /Save to Library/i }).click()
    await expect(page.getByText('Saved')).toBeVisible()
  })
})
