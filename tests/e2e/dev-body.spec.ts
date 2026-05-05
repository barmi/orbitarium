import { expect, test } from '@playwright/test'

test.describe('dev body inspector (/dev/body)', () => {
  test('default route /dev/body redirects to /dev/body/earth', async ({ page }) => {
    await page.goto('/dev/body')
    await expect(page).toHaveURL(/\/dev\/body\/earth$/)
    await expect(page.getByRole('heading', { name: 'Earth' })).toBeVisible()
  })

  test('/dev/body/saturn renders rings + ring toggle (Saturn-specific)', async ({ page }) => {
    await page.goto('/dev/body/saturn')
    await expect(page.getByRole('heading', { name: 'Saturn' })).toBeVisible()
    await expect(page.getByLabel('Rings toggle')).toBeVisible()
    const canvasPanel = page.getByTestId('body-canvas-panel')
    await expect(canvasPanel).toBeVisible()
    await expect(canvasPanel.locator('canvas')).toBeVisible()
  })

  test('non-ringed body (Earth) hides ring toggle', async ({ page }) => {
    await page.goto('/dev/body/earth')
    await expect(page.getByLabel('Rings toggle')).toHaveCount(0)
  })

  test('body picker navigates between bodies', async ({ page }) => {
    await page.goto('/dev/body/earth')
    await page.getByLabel('Body picker').selectOption('mars')
    await expect(page).toHaveURL(/\/dev\/body\/mars$/)
    await expect(page.getByRole('heading', { name: 'Mars' })).toBeVisible()
    await expect(page.getByTestId('overlay-slug')).toHaveText('mars')
  })

  test('time slider updates UTC + W angle', async ({ page }) => {
    await page.goto('/dev/body/earth')
    const utc = page.getByTestId('body-utc')
    const w = page.getByTestId('w-readout')
    const initialUtc = (await utc.textContent()) ?? ''
    const initialW = (await w.textContent()) ?? ''
    await page.getByLabel('Time offset days').fill('10')
    await expect.poll(async () => (await utc.textContent()) ?? '').not.toBe(initialUtc)
    await expect.poll(async () => (await w.textContent()) ?? '').not.toBe(initialW)
  })

  test('texture toggle flips overlay text', async ({ page }) => {
    await page.goto('/dev/body/earth')
    await page.getByLabel('Texture toggle').uncheck()
    await expect(page.getByTestId('body-canvas-panel')).toContainText('fallback')
    await page.getByLabel('Texture toggle').check()
    await expect(page.getByTestId('body-canvas-panel')).toContainText('texture')
  })

  test('rotation readout shows non-empty α/δ/W for Earth', async ({ page }) => {
    await page.goto('/dev/body/earth')
    await expect(page.getByTestId('ra-readout')).toContainText(/[0-9]/)
    await expect(page.getByTestId('dec-readout')).toContainText(/[0-9]/)
    await expect(page.getByTestId('w-readout')).toContainText(/[0-9]/)
  })

  test('unknown body slug shows fallback message', async ({ page }) => {
    await page.goto('/dev/body/notabody')
    await expect(page.getByText('Unknown body')).toBeVisible()
  })
})
