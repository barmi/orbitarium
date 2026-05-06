import { expect, test } from '@playwright/test'

test.describe('main solar app (/)', () => {
  test('renders title + canvas + body chips', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Orbitarium', level: 1 })).toBeVisible()

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)

    await expect(page.getByTestId('solar-chips')).toBeVisible()
    await expect(page.getByTestId('solar-time-panel')).toBeVisible()
  })

  test('canvas has an active WebGL context', async ({ page }) => {
    await page.goto('/')
    const ctxType = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas')
      if (!canvas) return null
      if (canvas.getContext('webgl2')) return 'webgl2'
      if (canvas.getContext('webgl')) return 'webgl'
      return null
    })
    expect(ctxType).toMatch(/^webgl2?$/)
  })

  test('UTC readout populated', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('solar-utc')).toContainText(/\d{4}-\d{2}-\d{2}T/)
  })

  test('body chip click focuses + updates share URL', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-chip-saturn').click()
    await expect(page.getByTestId('solar-chip-saturn')).toHaveAttribute('data-active', 'true')
    await page.waitForFunction(() => window.location.hash.includes('body=saturn'))
  })

  test('System chip clears focus', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-chip-earth').click()
    await page.getByTestId('solar-chip-system').click()
    await expect(page.getByTestId('solar-chip-system')).toHaveAttribute('data-active', 'true')
  })

  test('play / pause toggles clock', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByTestId('solar-play-toggle')
    await expect(toggle).toHaveText('▶')
    await toggle.click()
    await expect(toggle).toHaveText('⏸')
    await toggle.click()
    await expect(toggle).toHaveText('▶')
  })

  test('rate selector switches simulation rate', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-rate').selectOption('86400')
    await expect(page.getByTestId('solar-rate')).toHaveValue('86400')
  })

  test('share URL hash restores focus on reload', async ({ page }) => {
    await page.goto('/#?v=1&jd=2461166.5&body=jupiter')
    await expect(page.getByTestId('solar-chip-jupiter')).toHaveAttribute('data-active', 'true')
  })

  test('dev catalog link navigates to /dev/index', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /dev\/index/ }).click()
    await expect(page).toHaveURL(/\/dev\/index$/)
  })

  test('direction toggle reverses playback indicator', async ({ page }) => {
    await page.goto('/')
    const dir = page.getByTestId('solar-direction-toggle')
    await expect(dir).toHaveText('▶▶')
    await dir.click()
    await expect(dir).toHaveText('◀◀')
    await expect(dir).toHaveAttribute('aria-pressed', 'true')
    await dir.click()
    await expect(dir).toHaveText('▶▶')
  })

  test('step buttons advance/retreat the simulation clock', async ({ page }) => {
    await page.goto('/#?v=1&jd=2461166.5')
    const utc = page.getByTestId('solar-utc')
    const before = await utc.textContent()
    await page.getByTestId('solar-step-+1d').click()
    const after = await utc.textContent()
    expect(after).not.toEqual(before)
  })

  test('Now button jumps to current real-world UTC', async ({ page }) => {
    await page.goto('/#?v=1&jd=2451545.0')
    await expect(page.getByTestId('solar-utc')).toContainText('2000-01-01')
    await page.getByTestId('solar-now').click()
    await expect(page.getByTestId('solar-utc')).not.toContainText('2000-01-01')
  })

  test('Apply jump-input changes the clock to the entered UTC', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-jump-input').fill('2030-07-15T06:00:00')
    await page.getByTestId('solar-jump-apply').click()
    await expect(page.getByTestId('solar-utc')).toContainText('2030-07-15')
  })
})
