import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '../..')
const MANIFEST_PATH = path.join(REPO_ROOT, 'public/data/ephemeris/de440/manifest.json')
const DATA_AVAILABLE = existsSync(MANIFEST_PATH)

test.describe('scale dev demo (/dev/scale)', () => {
  test('renders header and four panels', async ({ page }) => {
    await page.goto('/dev/scale')

    await expect(page.getByRole('heading', { name: 'Scale System' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Policy Picker' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '1D Planet Lineup (current time)' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Distance Curve (log-linear)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Round-trip Sanity' })).toBeVisible()
  })

  test('round-trip panel shows tiny diff for default distance', async ({ page }) => {
    await page.goto('/dev/scale')

    const diff = page.getByTestId('roundtrip-diff')
    await expect(diff).toBeVisible()
    // Default 5 AU + piecewise-monotonic: round-trip should be ≪ 1 mm
    await expect(diff).toContainText(/e[+-]\d+/)
  })

  test('zoom slider value updates the displayed value', async ({ page }) => {
    await page.goto('/dev/scale')

    const zoomReadout = page.getByTestId('zoom-value')
    const roundTripForward = page.getByTestId('roundtrip-forward')
    await expect(zoomReadout).toContainText('0.00')
    const before = await roundTripForward.textContent()

    await page.getByLabel('Adaptive zoom').focus()
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight')
    }
    await expect(zoomReadout).toContainText('1.00')
    await expect(roundTripForward).not.toHaveText(before ?? '')
  })

  test.skip(!DATA_AVAILABLE, 'DE440 binaries not present — run `pnpm de440:preprocess` to enable')

  test('lineup table populates the 10 bodies', async ({ page }) => {
    await page.goto('/dev/scale')

    const table = page.getByTestId('lineup-table')
    await expect(table.locator('tbody tr')).toHaveCount(10)
    await expect(table).toContainText('Earth')
    await expect(table).toContainText('Pluto')
  })

  test('switching distance policy updates the curve label', async ({ page }) => {
    await page.goto('/dev/scale')

    await expect(page.getByTestId('curve-policy-name')).toContainText(
      'piecewise-monotonic -> logarithmic',
    )
    await page.getByLabel('Distance policy').getByText('logarithmic').click()
    await expect(page.getByTestId('curve-policy-name')).toContainText('logarithmic -> logarithmic')
  })
})
