import { decodeStarfieldBin, type StarfieldData } from './starfield'

export async function loadStarfieldFromUrl(url: string): Promise<StarfieldData> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch starfield from ${url}: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return decodeStarfieldBin(buffer)
}
