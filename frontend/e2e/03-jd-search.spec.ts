import { expect, test } from '@playwright/test'
import { jdResults, mockJdSearchApi, useEnglishLocale } from './helpers'

test.describe('JD Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
  })

  test('renders the modern JD search experience and returns results', async ({ page }) => {
    await mockJdSearchApi(page)

    await page.goto('/jd/search')
    await expect(page.getByRole('heading', { name: 'Find the Perfect Job Description' })).toBeVisible()

    await page.getByPlaceholder('e.g. Senior React Developer, Data Scientist, Product Manager...').fill('React Developer')
    await page.getByRole('button', { name: 'Search JDs' }).click()

    await expect(page.getByText('2 results found')).toBeVisible()
    await expect(page.getByText(jdResults[0].title)).toBeVisible()
    await expect(page.getByText(jdResults[1].title)).toBeVisible()
  })

  test('passes the selected JD into the CV builder', async ({ page }) => {
    await mockJdSearchApi(page)

    await page.goto('/jd/search')
    await page.getByPlaceholder('e.g. Senior React Developer, Data Scientist, Product Manager...').fill('React Developer')
    await page.getByRole('button', { name: 'Search JDs' }).click()

    await page.getByRole('button', { name: /Senior React Developer/i }).click()
    await expect(page.getByText('Build scalable React and Next.js product surfaces.')).toBeVisible()

    await page.locator('div.border-t button').last().click()

    await expect(page).toHaveURL('/cv/generate')
    const jdTextarea = page.getByPlaceholder('Paste full JD content here...')
    await expect(jdTextarea).toHaveValue(/Senior React Developer - Acme Tech/)
    await expect(jdTextarea).toHaveValue(/Build scalable React and Next\.js product surfaces\./)
  })

  test('shows the empty state when semantic search returns no matches', async ({ page }) => {
    await mockJdSearchApi(page, { results: [] })

    await page.goto('/jd/search')
    await page.getByPlaceholder('e.g. Senior React Developer, Data Scientist, Product Manager...').fill('Cobol Archaeologist')
    await page.getByRole('button', { name: 'Search JDs' }).click()

    await expect(page.getByText('No results found')).toBeVisible()
    await expect(page.getByText('Try a different search query')).toBeVisible()
  })
})
