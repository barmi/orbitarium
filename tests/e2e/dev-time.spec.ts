import { expect, test } from '@playwright/test'

test.describe('dev time demo (/dev/time)', () => {
  test('renders 4 panels with state', async ({ page }) => {
    await page.goto('/dev/time')
    await expect(page.getByRole('heading', { name: 'Time Control' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'State' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rate' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Scrubber' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible()
    await expect(page.getByTestId('clock-mode')).toHaveText('paused')
  })

  test('play / pause flips mode', async ({ page }) => {
    await page.goto('/dev/time')
    await page.getByLabel('Play').click()
    await expect(page.getByTestId('clock-mode')).toHaveText('realtime')
    await page.getByLabel('Pause').click()
    await expect(page.getByTestId('clock-mode')).toHaveText('paused')
  })

  test('rate slider updates and switches mode to fast', async ({ page }) => {
    await page.goto('/dev/time')
    await page.getByLabel('Play').click()
    await page.getByLabel('Rate').fill('3') // log10(rate)=3 → rate=1000
    await expect(page.getByTestId('clock-mode')).toHaveText('fast')
    await expect(page.getByTestId('clock-rate')).toContainText('1000')
  })

  test('preset jumps to a known jdTdb', async ({ page }) => {
    await page.goto('/dev/time')
    await page.getByLabel('Preset voyager1_launch').click()
    await expect(page.getByTestId('clock-jdtdb')).not.toHaveText(/^2451545/)
  })

  test('scrubber updates jdTdb', async ({ page }) => {
    await page.goto('/dev/time')
    const initial = await page.getByTestId('clock-jdtdb').textContent()
    await page.getByLabel('JdTdb offset').fill('100')
    const after = await page.getByTestId('clock-jdtdb').textContent()
    expect(after).not.toBe(initial)
  })
})
