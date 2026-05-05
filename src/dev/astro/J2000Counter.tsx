import { useEffect, useMemo, useState } from 'react'

import { jdToJ2000Days, utcToJdTdb } from '@/astro'

import { formatFixed } from './format'

interface DurationParts {
  sign: string
  days: number
  hours: number
  minutes: number
  seconds: number
}

function splitDuration(totalDays: number): DurationParts {
  const sign = totalDays < 0 ? '-' : '+'
  let totalSeconds = Math.floor(Math.abs(totalDays) * 86400)
  const days = Math.floor(totalSeconds / 86400)
  totalSeconds -= days * 86400
  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds -= hours * 3600
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60
  return { sign, days, hours, minutes, seconds }
}

export default function J2000Counter() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const jdTdb = utcToJdTdb(now)
  const elapsedDays = jdToJ2000Days(jdTdb)
  const parts = useMemo(() => splitDuration(elapsedDays), [elapsedDays])

  return (
    <section className="astro-panel" aria-labelledby="j2000-counter-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 2</p>
          <h2 id="j2000-counter-title">J2000 Counter</h2>
        </div>
        <time>{now.toISOString().replace('.000Z', 'Z')}</time>
      </div>

      <div className="astro-counter" data-testid="j2000-counter">
        <span>{parts.sign}</span>
        <strong>{parts.days.toLocaleString('en-US')}</strong>
        <span>d</span>
        <strong>{String(parts.hours).padStart(2, '0')}</strong>
        <span>h</span>
        <strong>{String(parts.minutes).padStart(2, '0')}</strong>
        <span>m</span>
        <strong>{String(parts.seconds).padStart(2, '0')}</strong>
        <span>s</span>
      </div>

      <dl className="astro-kv">
        <div>
          <dt>JD TDB</dt>
          <dd>{formatFixed(jdTdb, 9)}</dd>
        </div>
        <div>
          <dt>Elapsed days</dt>
          <dd>{formatFixed(elapsedDays, 9)}</dd>
        </div>
      </dl>
    </section>
  )
}
