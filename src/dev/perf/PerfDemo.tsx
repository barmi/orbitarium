import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { average, createEmptyWindow, type PerfMetrics, type PerfWindow, pushSample } from '@/perf'
import {
  BLOOM_PRESETS,
  type BloomSettings,
  clampBloom,
  DEFAULT_BLOOM_SETTINGS,
} from '@/postprocess'
import { Button, Panel, Slider } from '@/ui'

export default function PerfDemo() {
  const [bloom, setBloom] = useState<BloomSettings>(DEFAULT_BLOOM_SETTINGS)
  const [perfWindow, setPerfWindow] = useState<PerfWindow>(createEmptyWindow())

  // Synthetic perf samples (no real Canvas wired here; Work 12 hooks the real loop).
  useEffect(() => {
    const t = window.setInterval(() => {
      const synthetic: PerfMetrics = {
        fps: 60 - bloom.strength * 8,
        drawCalls: 50 + (bloom.enabled ? 12 : 0),
        triangles: 1_200_000 + (bloom.enabled ? 50_000 : 0),
        gpuMemoryMb: 120,
      }
      setPerfWindow((w) => pushSample(w, synthetic))
    }, 250)
    return () => clearInterval(t)
  }, [bloom])

  const avg = average(perfWindow)

  return (
    <main
      style={{
        padding: '1.25rem 1.5rem',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="ui-panel__eyebrow">WORK 11</p>
          <h1>Polish & Performance</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Panel title="Bloom" eyebrow="Panel 1">
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {Object.keys(BLOOM_PRESETS).map((key) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setBloom(BLOOM_PRESETS[key]!)}
                ariaLabel={`Bloom preset ${key}`}
                testId={`bloom-${key}`}
              >
                {key}
              </Button>
            ))}
          </div>
          <Slider
            label="Strength"
            value={bloom.strength}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => setBloom((s) => clampBloom({ ...s, strength: v }))}
            testId="bloom-strength"
          />
          <Slider
            label="Threshold"
            value={bloom.threshold}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setBloom((s) => clampBloom({ ...s, threshold: v }))}
            testId="bloom-threshold"
          />
        </Panel>

        <Panel title="Perf metrics (synthetic)" eyebrow="Panel 2">
          <div className="ui-panel">
            <div data-testid="perf-fps">FPS avg: {avg.fps.toFixed(1)}</div>
            <div data-testid="perf-drawcalls">Draw calls: {avg.drawCalls.toFixed(0)}</div>
            <div data-testid="perf-triangles">Triangles: {(avg.triangles / 1000).toFixed(0)}k</div>
            <div data-testid="perf-mem">GPU mem: {avg.gpuMemoryMb.toFixed(0)} MB</div>
            <div data-testid="perf-bloom-state">Bloom: {bloom.enabled ? 'ON' : 'OFF'}</div>
          </div>
        </Panel>
      </div>
    </main>
  )
}
