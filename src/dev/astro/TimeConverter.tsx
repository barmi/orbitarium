import { useMemo, useState } from 'react'

import {
  type JdTdb,
  jdToJ2000Days,
  jdToMjd,
  type JdTt,
  leapSecondsAt,
  utcToJdTai,
  utcToJdTdb,
  utcToJdTt,
  utcToJdUtc,
} from '@/astro'

import { formatFixed } from './format'
import { dateToUtcInputValue, parseUtcInput } from './timeInput'

interface TimeResult {
  date: Date
  leapSeconds: number
  jdUtc: number
  jdTai: number
  jdTt: JdTt
  jdTdb: JdTdb
}

function evaluateTime(value: string): TimeResult | { error: string } {
  const date = parseUtcInput(value)
  if (!date) {
    return { error: 'Invalid UTC datetime' }
  }
  try {
    const jdTt = utcToJdTt(date)
    const jdTdb = utcToJdTdb(date)
    return {
      date,
      leapSeconds: leapSecondsAt(date),
      jdUtc: utcToJdUtc(date),
      jdTai: utcToJdTai(date),
      jdTt,
      jdTdb,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to evaluate time' }
  }
}

export default function TimeConverter() {
  const [input, setInput] = useState(() => dateToUtcInputValue(new Date()))
  const result = useMemo(() => evaluateTime(input), [input])

  return (
    <section className="astro-panel" aria-labelledby="time-converter-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 1</p>
          <h2 id="time-converter-title">Time Converter</h2>
        </div>
        <button type="button" onClick={() => setInput(dateToUtcInputValue(new Date()))}>
          Now
        </button>
      </div>

      <label className="astro-field">
        <span>UTC</span>
        <input
          aria-label="UTC datetime"
          type="datetime-local"
          step="1"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
        />
      </label>

      {'error' in result ? (
        <p className="astro-error" role="alert">
          {result.error}
        </p>
      ) : (
        <dl className="astro-kv astro-kv--two">
          <div>
            <dt>UTC ISO</dt>
            <dd data-testid="utc-iso">{result.date.toISOString()}</dd>
          </div>
          <div>
            <dt>TAI - UTC</dt>
            <dd>{result.leapSeconds}s</dd>
          </div>
          <div>
            <dt>JD UTC</dt>
            <dd>{formatFixed(result.jdUtc, 9)}</dd>
          </div>
          <div>
            <dt>JD TAI</dt>
            <dd>{formatFixed(result.jdTai, 9)}</dd>
          </div>
          <div>
            <dt>JD TT</dt>
            <dd data-testid="jd-tt">{formatFixed(result.jdTt, 9)}</dd>
          </div>
          <div>
            <dt>JD TDB</dt>
            <dd data-testid="jd-tdb">{formatFixed(result.jdTdb, 9)}</dd>
          </div>
          <div>
            <dt>MJD TDB</dt>
            <dd>{formatFixed(jdToMjd(result.jdTdb), 9)}</dd>
          </div>
          <div>
            <dt>J2000 days</dt>
            <dd>{formatFixed(jdToJ2000Days(result.jdTdb), 9)}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
