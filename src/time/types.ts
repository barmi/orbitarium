import type { JdTdb } from '@/astro'

export type ClockMode = 'paused' | 'realtime' | 'fast'

export type ClockDirection = 1 | -1

export interface ClockState {
  readonly jdTdb: JdTdb
  readonly mode: ClockMode
  readonly rate: number
  readonly direction: ClockDirection
}

export type ClockAction =
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'setJdTdb'; readonly jdTdb: JdTdb }
  | { readonly type: 'setRate'; readonly rate: number }
  | { readonly type: 'setDirection'; readonly direction: ClockDirection }
  | { readonly type: 'tick'; readonly dtMs: number }
