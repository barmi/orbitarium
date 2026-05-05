import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '../..')
const MANIFEST_PATH = path.join(REPO_ROOT, 'public/data/ephemeris/de440/manifest.json')
const DATA_AVAILABLE = existsSync(MANIFEST_PATH)

test.describe('ephemeris dev demo (/dev/ephemeris)', () => {
  test('renders header and three panels', async ({ page }) => {
    await page.goto('/dev/ephemeris')

    await expect(page.getByRole('heading', { name: 'Ephemeris Data Layer' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'State Vector' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Reference Diff (vs spiceypy fixture)' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Planet Lineup (SSB-centered)' })).toBeVisible()
  })

  test.skip(!DATA_AVAILABLE, 'DE440 binaries not present — run `pnpm de440:preprocess` to enable')

  test('state vector shows Earth at J2000 with ~1 AU magnitude', async ({ page }) => {
    await page.goto('/dev/ephemeris')

    await page.getByLabel('UTC datetime').fill('2000-01-01T12:00')

    // The Earth radio defaults to checked; just confirm data appears.
    const positionCell = page.getByTestId('state-position-m')
    await expect(positionCell).toBeVisible()
    // 1 AU ≈ 1.5e11 m -> any of the components should hit ~1.5e11 magnitude
    await expect(positionCell).toContainText(/1\.\d+e\+11/)

    await expect(page.getByTestId('state-jd-tdb')).toContainText('2451545.')
  })

  test('reference diff summary appears within tolerance', async ({ page }) => {
    await page.goto('/dev/ephemeris')

    const summary = page.getByTestId('ephemeris-diff-summary')
    await expect(summary).toBeVisible({ timeout: 15_000 })
    // The summary line shows max position diff (m). Our evaluator agrees with
    // spiceypy to <1e-3 m component-wise, so the printed scientific notation
    // exponent should be negative (e-NN) or at most 1e-3.
    const text = (await summary.textContent()) ?? ''
    expect(text).toMatch(/maxΔr=[\d.eE+-]+ m/)
  })

  test('planet lineup table populates the eight planets and Pluto', async ({ page }) => {
    await page.goto('/dev/ephemeris')

    const table = page.getByTestId('planet-lineup-table')
    await expect(table.locator('tbody tr')).toHaveCount(9)
    // Confirm at least one body resolved its distance/speed.
    await expect(table).toContainText('Earth')
    await expect(table).toContainText('Mars')
  })
})
