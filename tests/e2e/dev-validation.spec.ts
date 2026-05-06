import { expect, test } from '@playwright/test'

test.describe('dev validation (/dev/validation)', () => {
  test('renders summary + table + 15 sample rows', async ({ page }) => {
    await page.goto('/dev/validation')
    await expect(page.getByRole('heading', { name: 'Validation' })).toBeVisible()
    await expect(page.getByTestId('validation-summary')).toContainText('Bodies: 5')
    await expect(page.getByTestId('validation-summary')).toContainText('Samples: 15')
    await expect(page.getByTestId('validation-row-0')).toBeVisible()
    await expect(page.getByTestId('validation-row-14')).toBeVisible()
  })

  test('mean diff shows synthetic 1.5 m', async ({ page }) => {
    await page.goto('/dev/validation')
    await expect(page.getByTestId('validation-summary')).toContainText('1.500')
  })
})
