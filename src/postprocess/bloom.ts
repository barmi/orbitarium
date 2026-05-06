/**
 * Bloom postprocess settings (Work 11).
 *
 * Pure config object; the actual postprocess pipeline (EffectComposer +
 * UnrealBloomPass) is wired up by callers — three.js' postprocess module is
 * heavy and we don't want it in the shared bundle. Dev demo dynamically
 * imports as needed.
 */

export interface BloomSettings {
  readonly enabled: boolean
  readonly strength: number
  readonly radius: number
  readonly threshold: number
}

export const DEFAULT_BLOOM_SETTINGS: BloomSettings = {
  enabled: false,
  strength: 1.2,
  radius: 0.4,
  threshold: 0.85,
}

export const BLOOM_PRESETS: Readonly<Record<string, BloomSettings>> = {
  off: { ...DEFAULT_BLOOM_SETTINGS, enabled: false },
  subtle: { enabled: true, strength: 0.6, radius: 0.3, threshold: 0.9 },
  cinematic: { enabled: true, strength: 1.5, radius: 0.5, threshold: 0.7 },
  intense: { enabled: true, strength: 2.5, radius: 0.7, threshold: 0.4 },
}

export function clampBloom(s: BloomSettings): BloomSettings {
  return {
    enabled: s.enabled,
    strength: Math.max(0, Math.min(5, s.strength)),
    radius: Math.max(0, Math.min(1, s.radius)),
    threshold: Math.max(0, Math.min(1, s.threshold)),
  }
}
