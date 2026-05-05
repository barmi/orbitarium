import { expect, test } from '@playwright/test'

test.describe('home page (/)', () => {
  test('renders title and three.js canvas', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Orbitarium', level: 1 })).toBeVisible()

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('FPS overlay updates with a number', async ({ page }) => {
    await page.goto('/')

    const fpsNum = page.locator('.fps-overlay__num')
    await expect(fpsNum).toBeVisible()

    await page.waitForFunction(
      () => {
        const el = document.querySelector('.fps-overlay__num')
        const text = el?.textContent?.trim() ?? ''
        const n = Number(text)
        return Number.isFinite(n) && n > 0
      },
      undefined,
      { timeout: 3000 },
    )
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
})
