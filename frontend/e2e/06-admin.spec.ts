import { expect, test } from '@playwright/test'
import { adminUsers, mockAdminApi, mockAuthAsAdmin, useEnglishLocale } from './helpers'

test.describe('Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await useEnglishLocale(page)
    await mockAuthAsAdmin(page)
    await mockAdminApi(page)
  })

  // ── UC-19: Admin dashboard & stats ─────────────────────────────────────────

  test('redirects admins from /dashboard into /dashboard/admin and loads stats', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard/admin')
    await expect(page.getByRole('heading', { name: 'System Administration' })).toBeVisible()
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Total CVs')).toBeVisible()
    await expect(page.getByText('Test Candidate')).toBeVisible()
  })

  // ── UC-20b: Create user ────────────────────────────────────────────────────

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

  // ── UC-20c: Update user ────────────────────────────────────────────────────

  test('updates user information from the admin panel', async ({ page }) => {
    await page.goto('/dashboard/admin')

    // The user list is shown in the Users tab (default view).
    // Click "Edit" on the first user row (CVCraft Admin).
    await page.getByRole('button', { name: 'Edit' }).first().click()

    // The User Form section pre-fills with the selected user's data.
    const userForm = page.locator('form').first()
    await expect(userForm.getByLabel('Full Name')).toHaveValue(adminUsers[0].fullName)

    // Change the full name
    await userForm.getByLabel('Full Name').fill('CVCraft Super Admin')

    // Submit — the button switches to "Update User" when a user is being edited
    await userForm.getByRole('button', { name: 'Update User' }).click()

    // Updated name must appear in the user list
    await expect(page.getByText('CVCraft Super Admin')).toBeVisible()
  })

  // ── UC-20d: Delete user ────────────────────────────────────────────────────

  test('deletes a user after confirming the admin confirmation modal', async ({ page }) => {
    await page.goto('/dashboard/admin')

    // Confirm both users are currently listed
    await expect(page.getByText('Test Candidate')).toBeVisible()

    // Click Delete on the first user row (CVCraft Admin)
    await page.getByRole('button', { name: 'Delete' }).first().click()

    // The admin page uses a ConfirmModal (hardcoded Vietnamese buttons)
    const confirmModal = page.locator('.fixed.inset-0.z-50')
    await expect(confirmModal).toBeVisible()

    // Confirm the deletion ("Xác nhận" is the hardcoded confirm label)
    await confirmModal.getByRole('button', { name: 'Xác nhận' }).click()

    // CVCraft Admin is removed; only Test Candidate should remain
    await expect(page.getByText('CVCraft Admin')).toHaveCount(0)
    await expect(page.getByText('Test Candidate')).toBeVisible()
  })

  // ── UC-21c: Update CV template ─────────────────────────────────────────────

  test('edits a CV template from the CV Templates tab', async ({ page }) => {
    await page.goto('/dashboard/admin')

    // Switch to the CV Templates tab
    await page.getByRole('button', { name: 'CV Templates' }).click()

    // "Classic Template" should be listed
    await expect(page.getByText('Classic Template')).toBeVisible()

    // Click Edit on the first template row
    await page.getByRole('button', { name: 'Edit' }).first().click()

    // The Template Form section pre-fills with the selected template's data
    const templateForm = page.locator('form').first()
    await expect(templateForm.getByLabel('Template Name')).toHaveValue('Classic Template')

    // Update the name
    await templateForm.getByLabel('Template Name').fill('Classic Template v2')

    // Submit — button text switches to "Save Template" in edit mode
    await templateForm.getByRole('button', { name: 'Save Template' }).click()

    // Updated name must appear in the template list
    await expect(page.getByText('Classic Template v2')).toBeVisible()
  })
})
