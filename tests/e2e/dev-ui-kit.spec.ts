import { expect, test } from '@playwright/test'

test.describe('dev ui-kit (/dev/ui-kit)', () => {
  test('renders 4 component panels', async ({ page }) => {
    await page.goto('/dev/ui-kit')
    await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Slider' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Body chips' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Time scrubber' })).toBeVisible()
  })

  test('button variants render', async ({ page }) => {
    await page.goto('/dev/ui-kit')
    await expect(page.getByTestId('btn-primary')).toBeVisible()
    await expect(page.getByTestId('btn-ghost')).toBeVisible()
    await expect(page.getByTestId('btn-disabled')).toBeDisabled()
  })

  test('slider updates value display', async ({ page }) => {
    await page.goto('/dev/ui-kit')
    await page.getByLabel('Demo slider').fill('80')
    await expect(page.getByTestId('slider-value')).toHaveText('80')
  })

  test('body chips toggle active state', async ({ page }) => {
    await page.goto('/dev/ui-kit')
    await page.getByTestId('chip-mars').click()
    await expect(page.getByTestId('chip-mars')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('chip-earth')).toHaveAttribute('data-active', 'false')
  })

  test('time scrubber updates jdTdb readout', async ({ page }) => {
    await page.goto('/dev/ui-kit')
    await page.getByLabel('Time scrubber').fill('2460000')
    await expect(page.getByTestId('ui-jd')).toContainText('2460000')
  })
})
