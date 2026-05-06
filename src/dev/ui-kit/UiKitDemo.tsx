import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BodyChip, Button, Panel, Slider, TimeScrubber } from '@/ui'

const BODIES = [
  { slug: 'mercury', label: 'Mercury' },
  { slug: 'venus', label: 'Venus' },
  { slug: 'earth', label: 'Earth' },
  { slug: 'mars', label: 'Mars' },
  { slug: 'jupiter', label: 'Jupiter' },
]

export default function UiKitDemo() {
  const [slider, setSlider] = useState(50)
  const [activeSlug, setActiveSlug] = useState('earth')
  const [jd, setJd] = useState(2_451_545.0)

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
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#8fb8ff', letterSpacing: '0.1em' }}>
            WORK 10
          </p>
          <h1>UI Kit</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Panel title="Buttons" eyebrow="Component 1">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => undefined} testId="btn-primary">
              Primary
            </Button>
            <Button variant="ghost" onClick={() => undefined} testId="btn-ghost">
              Ghost
            </Button>
            <Button variant="primary" disabled testId="btn-disabled">
              Disabled
            </Button>
          </div>
        </Panel>

        <Panel title="Slider" eyebrow="Component 2">
          <Slider
            label="Demo slider"
            value={slider}
            min={0}
            max={100}
            onChange={setSlider}
            testId="slider-value"
          />
        </Panel>

        <Panel title="Body chips" eyebrow="Component 3">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {BODIES.map((b) => (
              <BodyChip
                key={b.slug}
                slug={b.slug}
                label={b.label}
                active={activeSlug === b.slug}
                onClick={() => setActiveSlug(b.slug)}
                testId={`chip-${b.slug}`}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Time scrubber" eyebrow="Component 4">
          <TimeScrubber jdTdb={jd} minJd={2_440_000} maxJd={2_500_000} onJdChange={setJd} />
          <div style={{ fontSize: '0.78rem', color: '#cfd6d3' }} data-testid="ui-jd">
            jdTdb: {jd.toFixed(2)}
          </div>
        </Panel>
      </div>
    </main>
  )
}
