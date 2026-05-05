import { MeshBasicMaterial, MeshStandardMaterial, type Texture } from 'three'

const FALLBACK_TINT_WHEN_TEXTURED = '#ffffff'

/**
 * PBR material for rocky / icy / gas-giant bodies (Work 6 P3 #planet material).
 *
 * - ``MeshStandardMaterial`` with `roughness: 0.85, metalness: 0.0` —
 *   non-metallic diffuse surface. Work 11 polish can swap to anisotropic /
 *   normal-mapped material.
 * - When a texture is supplied, ``color`` stays white so the texture shows
 *   through. When null, ``color`` carries the body's fallback color.
 */
export function createPlanetMaterial(
  texture: Texture | null,
  fallbackColor: string,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map: texture,
    color: texture ? FALLBACK_TINT_WHEN_TEXTURED : fallbackColor,
    roughness: 0.85,
    metalness: 0.0,
  })
}

/**
 * Sun material — emissive, ignores incoming lighting (P3 #Sun material).
 *
 * Implemented as ``MeshBasicMaterial`` (lighting-agnostic) for now; Work 11
 * can swap to a custom shader for limb darkening / corona / activity textures.
 */
export function createSunMaterial(
  texture: Texture | null,
  fallbackColor: string,
): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map: texture,
    color: texture ? FALLBACK_TINT_WHEN_TEXTURED : fallbackColor,
  })
}
