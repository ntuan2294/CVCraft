import { expect, test } from '@playwright/test'
import { mockAdminApi, mockAuthAsAdmin, useEnglishLocale } from './helpers'

test.describe('Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
    await mockAuthAsAdmin(page)
    await mockAdminApi(page)
  })

  test('redirects admins from /dashboard into /dashboard/admin and loads stats', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard/admin')
    await expect(page.getByRole('heading', { name: 'System Administration' })).toBeVisible()
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Total CVs')).toBeVisible()
    await expect(page.getByText('Test Candidate')).toBeVisible()
  })

  test('creates a new user from the admin user form', async ({ page }) => {
    await page.goto('/dashboard/admin')

    const userForm = page.locator('form').first()
    await userForm.getByLabel('Full Name').fill('Ops Manager')
    await userForm.getByLabel('Email').fill('ops-manager@example.com')
    await userForm.getByLabel('Password').fill('password123')
    await userForm.getByLabel('Phone').fill('0900123456')
    await userForm.locator('select').selectOption('ADMIN')
    await userForm.getByRole('button', { name: 'Create User' }).click()

    await expect(page.getByText('ops-manager@example.com')).toBeVisible()
    await expect(page.getByText('Ops Manager')).toBeVisible()
  })

  test('edits CV metadata from the admin CV library tab', async ({ page }) => {
    await page.goto('/dashboard/admin')
    await page.getByRole('button', { name: 'CV Library' }).click()
    await page.getByRole('button', { name: 'Edit' }).first().click()

    const cvForm = page.locator('form').first()
    await cvForm.getByLabel('CV Title').fill('Updated Admin CV Title')
    await cvForm.getByRole('button', { name: 'Save CV Changes' }).click()

    await expect(page.getByText('Updated Admin CV Title')).toBeVisible()
  })
})
