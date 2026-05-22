import { expect, test } from '@playwright/test'
import { clearAuth, mockAuthAsAdmin, useEnglishLocale } from './helpers'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
    await clearAuth(page)
  })

  test('shows the streamlined hero without the old search form', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Build a Professional CV' })).toBeVisible()
    await expect(page.locator('main a[href="/cv/generate"]').first()).toBeVisible()
    await expect(page.locator('main a[href="/jd/search"]').first()).toBeVisible()
    await expect(page.locator('main form')).toHaveCount(0)
  })

  test('shows guest navigation for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('nav a[href="/auth/login"]')).toBeVisible()
    await expect(page.locator('nav a[href="/auth/register"]')).toBeVisible()
    await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible()
    await expect(page.locator('nav a[href="/dashboard/admin"]')).toHaveCount(0)
  })

  test('shows admin entry points when an admin is signed in', async ({ page }) => {
    await mockAuthAsAdmin(page)

    await page.goto('/')

    await expect(page.locator('nav a[href="/dashboard/admin"]')).toBeVisible()
    await expect(page.locator('nav a[href="/dashboard"]')).toHaveCount(0)

    await page.locator('nav button').filter({ hasText: 'CVCraft' }).click()
    const dropdown = page.locator('nav .absolute.right-0')
    await expect(dropdown.getByRole('link', { name: 'Admin Panel' })).toBeVisible()
    await expect(dropdown.getByRole('link', { name: 'Build CV' })).toBeVisible()
  })
})
