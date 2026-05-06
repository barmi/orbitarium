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

  test('Settings panel toggles open + persists policy choice in URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('solar-settings-panel')).toHaveCount(0)
    await page.getByTestId('solar-settings-toggle').click()
    await expect(page.getByTestId('solar-settings-panel')).toBeVisible()
    await page.getByTestId('solar-distance-logarithmic').check()
    await page.waitForFunction(() => window.location.hash.includes('dist=logarithmic'))
    await page.getByTestId('solar-size-minmax-clamp').check()
    await page.waitForFunction(() => window.location.hash.includes('size=minmax-clamp'))
  })

  test('share URL hash restores policy choice on reload', async ({ page }) => {
    await page.goto('/#?v=1&jd=2461166.5&dist=logarithmic&size=uniform')
    await page.getByTestId('solar-settings-toggle').click()
    await expect(page.getByTestId('solar-distance-logarithmic')).toBeChecked()
    await expect(page.getByTestId('solar-size-uniform')).toBeChecked()
  })

  test('orbit + starfield checkboxes update URL and disable vmag slider', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-settings-toggle').click()
    await page.getByTestId('solar-toggle-orbits').uncheck()
    await page.waitForFunction(() => window.location.hash.includes('o=0'))
    await page.getByTestId('solar-toggle-starfield').uncheck()
    await page.waitForFunction(() => window.location.hash.includes('s=0'))
    await expect(page.getByTestId('solar-vmag-slider')).toBeDisabled()
  })

  test('vmag slider updates label + URL', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-settings-toggle').click()
    const slider = page.getByTestId('solar-vmag-slider')
    await slider.fill('3.5')
    await expect(page.getByTestId('solar-vmag-value')).toHaveText('3.5')
    await page.waitForFunction(() => window.location.hash.includes('vm=3.50'))
  })

  test('time preset jumps to J2000', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-preset').selectOption('j2000')
    await expect(page.getByTestId('solar-utc')).toContainText('2000-01-01')
  })

  test('moons-visible preset sets size scale to 0.005 + URL ss=', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('solar-settings-toggle').click()
    await page.getByTestId('solar-sizescale-moons').click()
    await expect(page.getByTestId('solar-sizescale-value')).toHaveText('0.005')
    await page.waitForFunction(() => window.location.hash.includes('ss=0.005'))
    await page.getByTestId('solar-sizescale-default').click()
    await expect(page.getByTestId('solar-sizescale-value')).toHaveText('1.000')
    await page.waitForFunction(() => !window.location.hash.includes('ss='))
  })
})
