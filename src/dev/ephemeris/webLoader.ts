import type { De440SegmentLoader } from '@/ephemeris'
import {
  type De440Manifest,
  type De440Segment,
  parseManifestJson,
  parseSegmentBinary,
} from '@/ephemeris'

export interface WebLoaderOptions {
  readonly baseUrl?: string
}

const DEFAULT_BASE_URL = `${import.meta.env.BASE_URL}data/ephemeris/de440/`

export function createWebDe440Loader({
  baseUrl = DEFAULT_BASE_URL,
}: WebLoaderOptions = {}): De440SegmentLoader {
  return {
    async loadManifest(): Promise<De440Manifest> {
      const response = await fetch(`${baseUrl}manifest.json`)
      if (!response.ok) {
        throw new Error(`manifest fetch failed: ${response.status} ${response.statusText}`)
      }
      const text = await response.text()
      return parseManifestJson(text)
    },
    async loadSegment(target: number, center: number): Promise<De440Segment> {
      const response = await fetch(`${baseUrl}spk_${target}_${center}.bin`)
      if (!response.ok) {
        throw new Error(
          `segment fetch failed for ${target}/${center}: ${response.status} ${response.statusText}`,
        )
      }
      const buffer = await response.arrayBuffer()
      return parseSegmentBinary(buffer)
    },
  }
}
