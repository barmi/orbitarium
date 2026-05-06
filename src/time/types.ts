import type { JdTdb } from '@/astro'

export type ClockMode = 'paused' | 'realtime' | 'fast'

export interface ClockState {
  readonly jdTdb: JdTdb
  readonly mode: ClockMode
  readonly rate: number
}

export type ClockAction =
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'setJdTdb'; readonly jdTdb: JdTdb }
  | { readonly type: 'setRate'; readonly rate: number }
  | { readonly type: 'tick'; readonly dtMs: number }
