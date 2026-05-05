import { expect, test } from '@playwright/test'

test.describe('dev catalog (/dev/index)', () => {
  test('lists 11 work cards', async ({ page }) => {
    await page.goto('/dev/index')

    await expect(page.getByRole('heading', { name: 'Dev Catalog' })).toBeVisible()

    const cards = page.locator('.dev-card')
    await expect(cards).toHaveCount(11)
  })

  test('Work 2 is available and the rest are placeholders', async ({ page }) => {
    await page.goto('/dev/index')

    const placeholders = page.locator('.dev-card[data-status="placeholder"]')
    await expect(placeholders).toHaveCount(10)

    const available = page.locator('.dev-card[data-status="available"]')
    await expect(available).toHaveCount(1)
    await expect(available).toContainText('Astronomy Foundations')
  })

  test('each card shows work number, title, and target slug', async ({ page }) => {
    await page.goto('/dev/index')

    const firstCard = page.locator('.dev-card').first()
    await expect(firstCard.locator('.dev-card__num')).toContainText(/Work \d+/)
    await expect(firstCard.locator('h2')).toBeVisible()
    await expect(firstCard.locator('code')).toContainText(/^\/dev\//)
  })

  test('home → /dev/index navigation works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /\/dev\/index/ }).click()
    await expect(page).toHaveURL(/\/dev\/index$/)
    await expect(page.getByRole('heading', { name: 'Dev Catalog' })).toBeVisible()
  })

  test('Work 2 card opens /dev/astro', async ({ page }) => {
    await page.goto('/dev/index')
    await page.getByRole('link', { name: /Astronomy Foundations/ }).click()
    await expect(page).toHaveURL(/\/dev\/astro$/)
    await expect(page.getByRole('heading', { name: 'Astronomy Foundations' })).toBeVisible()
  })
})
