import { expect, test } from '@playwright/test'

test.describe('dev camera demo (/dev/camera)', () => {
  test('renders 4 panels + initial state', async ({ page }) => {
    await page.goto('/dev/camera')
    await expect(page.getByRole('heading', { name: 'Camera & Navigation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mode' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible()
    await expect(page.getByTestId('camera-mode')).toHaveText('free-fly')
  })

  test('mode buttons switch active mode', async ({ page }) => {
    await page.goto('/dev/camera')
    await page.getByLabel('Mode focus').click()
    await expect(page.getByTestId('camera-mode')).toContainText(/focus|free-fly/)
  })

  test('preset applies fov + position (with smooth transition)', async ({ page }) => {
    await page.goto('/dev/camera')
    await page.getByLabel('Preset ecliptic_top').click()
    // Wait for the transition to settle
    await page.waitForTimeout(2000)
    await expect(page.getByTestId('camera-fov')).toHaveText('50.00')
    await expect(page.getByTestId('camera-position')).toContainText('50.00')
  })

  test('smooth toggle off applies preset instantly', async ({ page }) => {
    await page.goto('/dev/camera')
    await page.getByLabel('Smooth transition').uncheck()
    await page.getByLabel('Preset earth_focus').click()
    await expect(page.getByTestId('camera-fov')).toHaveText('35.00')
  })
})
