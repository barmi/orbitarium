import { useEffect, useMemo, useState } from 'react'

import type { JdTdb } from '@/astro'
import type { De440Evaluator } from '@/ephemeris'

import { DEMO_BODIES } from './bodies'
import { formatExp } from './format'

interface FixtureEntry {
  readonly naif_id: number
  readonly jd_tdb: number
  readonly position_m: readonly [number, number, number]
  readonly velocity_m_s: readonly [number, number, number]
}

interface FixtureFile {
  readonly _tolerance_m: number
  readonly _tolerance_vel_m_s: number
  readonly fixtures: readonly FixtureEntry[]
}

interface Props {
  readonly evaluator: De440Evaluator | null
}

interface DiffRow {
  readonly entry: FixtureEntry
  readonly bodyLabel: string
  readonly posDiffM: number
  readonly velDiffMps: number
}

const FIXTURE_URL = '/fixtures/work-03/de440-states.json'

async function fetchFixture(): Promise<FixtureFile | null> {
  // Try the public path served by Vite during dev / preview, fall back to the
  // committed test fixture path used in CI.
  for (const url of [FIXTURE_URL, '/tests/fixtures/work-03/de440-states.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return (await res.json()) as FixtureFile
      }
    } catch {
      // try next
    }
  }
  return null
}

export default function ReferenceDiffPanel({ evaluator }: Props) {
  const [fixture, setFixture] = useState<FixtureFile | null>(null)
  const [rows, setRows] = useState<readonly DiffRow[]>([])
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    void fetchFixture().then((file) => {
      if (file) setFixture(file)
      else setWarning('fixture not reachable in this environment')
    })
  }, [])

  useEffect(() => {
    if (!evaluator || !fixture) {
      setRows([])
      return
    }
    let cancelled = false
    void Promise.all(
      fixture.fixtures.map(async (entry): Promise<DiffRow> => {
        const sv = await evaluator.getStateAt(entry.naif_id, entry.jd_tdb as JdTdb)
        const posDiffM = Math.max(
          Math.abs((sv.position[0] as number) - entry.position_m[0]),
          Math.abs((sv.position[1] as number) - entry.position_m[1]),
          Math.abs((sv.position[2] as number) - entry.position_m[2]),
        )
        const velDiffMps = Math.max(
          Math.abs((sv.velocity[0] as number) - entry.velocity_m_s[0]),
          Math.abs((sv.velocity[1] as number) - entry.velocity_m_s[1]),
          Math.abs((sv.velocity[2] as number) - entry.velocity_m_s[2]),
        )
        const body = DEMO_BODIES.find((b) => b.naifId === entry.naif_id)
        return {
          entry,
          bodyLabel: body?.label ?? `NAIF ${entry.naif_id}`,
          posDiffM,
          velDiffMps,
        }
      }),
    ).then((next) => {
      if (!cancelled) setRows(next)
    })
    return () => {
      cancelled = true
    }
  }, [evaluator, fixture])

  const summary = useMemo(() => {
    if (rows.length === 0) return null
    const maxPos = Math.max(...rows.map((r) => r.posDiffM))
    const maxVel = Math.max(...rows.map((r) => r.velDiffMps))
    return { maxPos, maxVel, count: rows.length }
  }, [rows])

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="ephemeris-diff-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 2</p>
          <h2 id="ephemeris-diff-title">Reference Diff (vs spiceypy fixture)</h2>
        </div>
        {summary && (
          <output data-testid="ephemeris-diff-summary">
            n={summary.count} · maxΔr={formatExp(summary.maxPos, 3)} m · maxΔv=
            {formatExp(summary.maxVel, 3)} m/s
          </output>
        )}
      </div>

      {warning && (
        <p className="astro-error" role="alert">
          {warning}
        </p>
      )}

      <div className="astro-table-wrap">
        <table className="astro-table">
          <thead>
            <tr>
              <th>Body</th>
              <th>JD TDB</th>
              <th>|Δr|∞ (m)</th>
              <th>|Δv|∞ (m/s)</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 24).map((r, i) => (
              <tr key={`${r.entry.naif_id}-${r.entry.jd_tdb}-${i}`}>
                <td>{r.bodyLabel}</td>
                <td>{r.entry.jd_tdb.toFixed(4)}</td>
                <td>{formatExp(r.posDiffM, 3)}</td>
                <td>{formatExp(r.velDiffMps, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
