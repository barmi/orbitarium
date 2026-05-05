import { expect, test } from '@playwright/test'

test.describe('dev render demo (/dev/render)', () => {
  test('loads page with all four panels and a canvas', async ({ page }) => {
    await page.goto('/dev/render')

    await expect(page.getByRole('heading', { name: 'Rendering Foundation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Renderer' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Starfield (Hipparcos)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Scene Anchor' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Scene Info' })).toBeVisible()

    const canvasPanel = page.getByTestId('render-canvas-panel')
    await expect(canvasPanel).toBeVisible()
    await expect(canvasPanel.locator('canvas')).toBeVisible()
  })

  test('exposure slider updates the readout', async ({ page }) => {
    await page.goto('/dev/render')
    const value = page.getByTestId('exposure-value')
    await expect(value).toHaveText('1.00')
    await page.getByLabel('Tone mapping exposure').fill('2')
    await expect(value).toHaveText('2.00')
  })

  test('log-depth toggle flips the readout + overlay text', async ({ page }) => {
    await page.goto('/dev/render')
    const readout = page.getByTestId('log-depth-value')
    await expect(readout).toHaveText('ON')
    await page.getByLabel('Logarithmic depth buffer').click()
    await expect(readout).toHaveText('OFF')
    await expect(page.getByTestId('render-canvas-panel')).toContainText('log-depth: OFF')
  })

  test('starfield catalog count appears once data loads', async ({ page }) => {
    await page.goto('/dev/render')
    const count = page.getByTestId('starfield-count')
    await expect(count).toContainText(/\d+\s*\/\s*\d+\s*stars/, { timeout: 10000 })
  })

  test('vmag cutoff slider lowers the visible star count', async ({ page }) => {
    await page.goto('/dev/render')
    const count = page.getByTestId('starfield-count')
    await expect(count).toContainText(/\d+\s*\/\s*\d+\s*stars/, { timeout: 10000 })
    const initial = (await count.textContent()) ?? ''
    const initialVisible = Number(initial.split('/')[0]?.trim() ?? '0')
    await page.getByLabel('Vmag cutoff').fill('2')
    await expect
      .poll(async () => {
        const text = (await count.textContent()) ?? ''
        return Number(text.split('/')[0]?.trim() ?? '0')
      })
      .toBeLessThan(initialVisible)
  })

  test('anchor picker shows body selector when body-centric is chosen', async ({ page }) => {
    await page.goto('/dev/render')
    await page.getByLabel('body-centric').click()
    await expect(page.getByLabel('Body NAIF id')).toBeVisible()
  })
})
