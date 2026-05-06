import type { JdTdb } from '@/astro'
import { utcToJdTdb } from '@/astro'

export interface TimePreset {
  readonly id: string
  readonly label: string
  readonly utcIso: string
  readonly jdTdb: JdTdb
}

function preset(id: string, label: string, utcIso: string): TimePreset {
  return { id, label, utcIso, jdTdb: utcToJdTdb(new Date(utcIso)) }
}

export const TIME_PRESETS: readonly TimePreset[] = [
  preset('j2000', 'J2000 (2000-01-01 12:00 TT)', '2000-01-01T12:00:00Z'),
  preset('voyager1_launch', 'Voyager 1 launch', '1977-09-05T12:56:00Z'),
  preset('eclipse_2024', '2024-04-08 total eclipse', '2024-04-08T18:18:00Z'),
  preset('present', '2026-05-06 (Work 8 demo)', '2026-05-06T00:00:00Z'),
]
