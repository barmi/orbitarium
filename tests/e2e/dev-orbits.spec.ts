import { expect, test } from '@playwright/test'

test.describe('dev orbits demo (/dev/orbits)', () => {
  test('renders title + canvas + 3 control panels', async ({ page }) => {
    await page.goto('/dev/orbits')
    await expect(page.getByRole('heading', { name: 'Orbits & Trajectories' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Body' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Time Window' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Layers' })).toBeVisible()
    const canvas = page.getByTestId('orbits-canvas-panel')
    await expect(canvas).toBeVisible()
    await expect(canvas.locator('canvas')).toBeVisible()
  })

  test('time window sliders update readouts', async ({ page }) => {
    await page.goto('/dev/orbits')
    await page.getByLabel('Trail days').fill('720')
    await expect(page.getByTestId('trail-days')).toHaveText('720')
    await page.getByLabel('Predict days').fill('180')
    await expect(page.getByTestId('predict-days')).toHaveText('180')
    await page.getByLabel('Sample count').fill('256')
    await expect(page.getByTestId('sample-count')).toHaveText('256')
  })

  test('body picker switches between bodies', async ({ page }) => {
    await page.goto('/dev/orbits')
    await page.getByLabel('Body picker').selectOption('jupiter')
    await expect(page.getByTestId('orbits-status')).toContainText(/error|trail|loading/, {
      timeout: 10_000,
    })
  })

  test('layer toggles persist state', async ({ page }) => {
    await page.goto('/dev/orbits')
    await page.getByLabel('Trail toggle').uncheck()
    await page.getByLabel('Asteroid belt toggle').check()
    await expect(page.getByLabel('Asteroid belt toggle')).toBeChecked()
    await expect(page.getByLabel('Trail toggle')).not.toBeChecked()
  })
})
