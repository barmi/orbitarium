/**
 * Share URL encoding (Work 10).
 *
 * Roundtrip: ``encodeShareState({ jdTdb, bodySlug, cameraMode }) → '#?...'``
 * → ``decodeShareState(hash)``. Uses URLSearchParams over the URL fragment so
 * the server never sees this state. Numeric fields kept as decimal strings
 * for human readability.
 */

export interface ShareState {
  readonly jdTdb: number
  readonly bodySlug: string | null
  readonly cameraMode: string | null
  readonly distancePolicy: string | null
  readonly sizePolicy: string | null
  readonly showOrbits: boolean | null
  readonly showStarfield: boolean | null
  readonly vmagCutoff: number | null
  readonly sizeScale: number | null
}

export const SHARE_VERSION = 1

export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams()
  params.set('v', SHARE_VERSION.toString())
  params.set('jd', state.jdTdb.toFixed(6))
  if (state.bodySlug) params.set('body', state.bodySlug)
  if (state.cameraMode) params.set('cam', state.cameraMode)
  if (state.distancePolicy) params.set('dist', state.distancePolicy)
  if (state.sizePolicy) params.set('size', state.sizePolicy)
  if (state.showOrbits === false) params.set('o', '0')
  if (state.showStarfield === false) params.set('s', '0')
  if (state.vmagCutoff !== null && state.vmagCutoff !== undefined) {
    params.set('vm', state.vmagCutoff.toFixed(2))
  }
  if (state.sizeScale !== null && state.sizeScale !== undefined) {
    params.set('ss', state.sizeScale.toFixed(3))
  }
  return `#?${params.toString()}`
}

function parseBool(v: string | null): boolean | null {
  if (v === null) return null
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return null
}

export function decodeShareState(hash: string): ShareState | null {
  const cleaned = hash.replace(/^#/, '').replace(/^\?/, '')
  if (!cleaned) return null
  const params = new URLSearchParams(cleaned)
  const v = Number(params.get('v') ?? '0')
  if (v !== SHARE_VERSION) return null
  const jd = Number(params.get('jd') ?? 'NaN')
  if (Number.isNaN(jd)) return null
  const vmRaw = params.get('vm')
  const vm = vmRaw === null ? null : Number(vmRaw)
  const ssRaw = params.get('ss')
  const ss = ssRaw === null ? null : Number(ssRaw)
  return {
    jdTdb: jd,
    bodySlug: params.get('body'),
    cameraMode: params.get('cam'),
    distancePolicy: params.get('dist'),
    sizePolicy: params.get('size'),
    showOrbits: parseBool(params.get('o')),
    showStarfield: parseBool(params.get('s')),
    vmagCutoff: vm !== null && Number.isFinite(vm) ? vm : null,
    sizeScale: ss !== null && Number.isFinite(ss) ? ss : null,
  }
}
