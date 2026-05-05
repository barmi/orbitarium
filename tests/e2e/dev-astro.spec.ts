import { expect, test } from '@playwright/test'

test.describe('astro dev demo (/dev/astro)', () => {
  test('renders the four Work 2 panels', async ({ page }) => {
    await page.goto('/dev/astro')

    await expect(page.getByRole('heading', { name: 'Astronomy Foundations' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Time Converter' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'J2000 Counter' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frame Converter' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Earth Rotation' })).toBeVisible()
  })

  test('time converter evaluates a fixed UTC instant', async ({ page }) => {
    await page.goto('/dev/astro')

    await page.getByLabel('UTC datetime').fill('2000-01-01T12:00')

    await expect(page.getByTestId('utc-iso')).toHaveText('2000-01-01T12:00:00.000Z')
    await expect(page.getByTestId('jd-tdb')).toContainText('2451545.')
  })

  test('frame converter updates output and round-trip sanity', async ({ page }) => {
    await page.goto('/dev/astro')

    await page.getByLabel('Vector X').fill('0')
    await page.getByLabel('Vector Y').fill('0')
    await page.getByLabel('Vector Z').fill('1')

    await expect(page.getByTestId('frame-ecliptic')).toContainText('9.174821e-1')
    await expect(page.getByTestId('round-trip-error')).toContainText(/e[+-]\d+/)
  })

  test('earth rotation computes W for a fixed UTC instant', async ({ page }) => {
    await page.goto('/dev/astro')

    await page.getByLabel('Earth rotation UTC').fill('2026-05-05T00:00')

    await expect(page.getByTestId('earth-w')).toContainText('°')
    await expect(page.getByTestId('earth-w')).not.toContainText('NaN')
  })
})
