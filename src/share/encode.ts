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
  return `#?${params.toString()}`
}

export function decodeShareState(hash: string): ShareState | null {
  const cleaned = hash.replace(/^#/, '').replace(/^\?/, '')
  if (!cleaned) return null
  const params = new URLSearchParams(cleaned)
  const v = Number(params.get('v') ?? '0')
  if (v !== SHARE_VERSION) return null
  const jd = Number(params.get('jd') ?? 'NaN')
  if (Number.isNaN(jd)) return null
  return {
    jdTdb: jd,
    bodySlug: params.get('body'),
    cameraMode: params.get('cam'),
    distancePolicy: params.get('dist'),
    sizePolicy: params.get('size'),
  }
}
