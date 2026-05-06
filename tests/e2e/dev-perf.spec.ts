import { expect, test } from '@playwright/test'

test.describe('dev perf demo (/dev/perf)', () => {
  test('renders bloom + perf panels', async ({ page }) => {
    await page.goto('/dev/perf')
    await expect(page.getByRole('heading', { name: 'Polish & Performance' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bloom' })).toBeVisible()
    await expect(page.getByTestId('perf-fps')).toBeVisible()
  })

  test('bloom presets toggle state', async ({ page }) => {
    await page.goto('/dev/perf')
    await page.getByTestId('bloom-cinematic').click()
    await expect(page.getByTestId('perf-bloom-state')).toContainText('ON')
    await page.getByTestId('bloom-off').click()
    await expect(page.getByTestId('perf-bloom-state')).toContainText('OFF')
  })

  test('strength slider updates value', async ({ page }) => {
    await page.goto('/dev/perf')
    await page.getByLabel('Strength').fill('3')
    await expect(page.getByTestId('bloom-strength')).toHaveText('3')
  })
})
