import type { JdTdb } from '@/astro'

import { evaluateChebyshevAndDerivative } from './chebyshev'
import type { De440Manifest, De440Segment, De440SegmentMeta } from './de440Format'
import { positionICRF, type StateVectorICRF, velocityICRF } from './types'

export interface De440SegmentLoader {
  loadManifest(): Promise<De440Manifest>
  loadSegment(target: number, center: number): Promise<De440Segment>
}

export interface De440Evaluator {
  getManifest(): Promise<De440Manifest>
  getStateAt(naifId: number, jdTdb: JdTdb): Promise<StateVectorICRF>
}

const KM_TO_M = 1000
const SECONDS_PER_DAY = 86400

interface ComponentResult {
  readonly position: [number, number, number]
  readonly velocity: [number, number, number]
}

function evaluateSegmentAt(segment: De440Segment, jdTdb: number): ComponentResult {
  const range = segment.intervalLengthDays * segment.nIntervals
  const rel = jdTdb - segment.initJdTdb
  if (rel < 0 || rel > range) {
    throw new Error(
      `jdTdb=${jdTdb} outside segment [${segment.initJdTdb}, ${segment.initJdTdb + range}] ` +
        `for target=${segment.target} center=${segment.center}`,
    )
  }

  let idx = Math.floor(rel / segment.intervalLengthDays)
  if (idx === segment.nIntervals) idx -= 1

  const s = (2 * (rel - idx * segment.intervalLengthDays)) / segment.intervalLengthDays - 1
  const dsDjd = 2 / segment.intervalLengthDays

  const k = segment.coefCount
  const stride = segment.nIntervals * k
  const coefs = segment.coefficients

  const cx = evaluateChebyshevAndDerivative(
    coefs.subarray(0 * stride + idx * k, 0 * stride + idx * k + k),
    s,
  )
  const cy = evaluateChebyshevAndDerivative(
    coefs.subarray(1 * stride + idx * k, 1 * stride + idx * k + k),
    s,
  )
  const cz = evaluateChebyshevAndDerivative(
    coefs.subarray(2 * stride + idx * k, 2 * stride + idx * k + k),
    s,
  )

  const velScale = (dsDjd * KM_TO_M) / SECONDS_PER_DAY

  return {
    position: [cx.value * KM_TO_M, cy.value * KM_TO_M, cz.value * KM_TO_M],
    velocity: [cx.derivative * velScale, cy.derivative * velScale, cz.derivative * velScale],
  }
}

function findChain(manifest: De440Manifest, initialTarget: number): readonly De440SegmentMeta[] {
  const chain: De440SegmentMeta[] = []
  let head = initialTarget
  for (let safety = 0; safety < manifest.segments.length + 1; safety++) {
    const seg = manifest.segments.find((s) => s.target === head)
    if (!seg) {
      throw new Error(`no DE440 segment for target=${head}`)
    }
    chain.push(seg)
    if (seg.center === 0) {
      return chain
    }
    head = seg.center
  }
  throw new Error(`DE440 segment chain did not terminate at SSB for target=${initialTarget}`)
}

export function createDe440Evaluator(loader: De440SegmentLoader): De440Evaluator {
  let manifestPromise: Promise<De440Manifest> | null = null
  const segmentCache = new Map<string, Promise<De440Segment>>()

  function loadManifest(): Promise<De440Manifest> {
    manifestPromise ??= loader.loadManifest()
    return manifestPromise
  }

  function loadSegment(target: number, center: number): Promise<De440Segment> {
    const key = `${target}/${center}`
    let promise = segmentCache.get(key)
    if (!promise) {
      promise = loader.loadSegment(target, center)
      segmentCache.set(key, promise)
    }
    return promise
  }

  async function getStateAt(naifId: number, jdTdb: JdTdb): Promise<StateVectorICRF> {
    const manifest = await loadManifest()
    const aliasMap = manifest.aliases_planet_body_to_barycenter
    const aliased = aliasMap[String(naifId)] ?? naifId

    const chain = findChain(manifest, aliased)
    let px = 0
    let py = 0
    let pz = 0
    let vx = 0
    let vy = 0
    let vz = 0
    for (const meta of chain) {
      const segment = await loadSegment(meta.target, meta.center)
      const { position, velocity } = evaluateSegmentAt(segment, jdTdb)
      px += position[0]
      py += position[1]
      pz += position[2]
      vx += velocity[0]
      vy += velocity[1]
      vz += velocity[2]
    }

    return {
      naifId,
      jdTdb,
      position: positionICRF(px, py, pz),
      velocity: velocityICRF(vx, vy, vz),
    }
  }

  return {
    getManifest: loadManifest,
    getStateAt,
  }
}
