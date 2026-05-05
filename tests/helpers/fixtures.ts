import { readFileSync } from 'node:fs'
import path from 'node:path'

const FIXTURES_ROOT = path.resolve(__dirname, '..', 'fixtures')

export function workFixturesDir(workNumber: number): string {
  const padded = String(workNumber).padStart(2, '0')
  return path.join(FIXTURES_ROOT, `work-${padded}`)
}

export function loadWorkFixture<T>(workNumber: number, filename: string): T {
  const filePath = path.join(workFixturesDir(workNumber), filename)
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}
