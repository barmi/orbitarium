import type { JdTdb } from '@/astro'

import { DEFAULT_RATE, J2000_JD_TDB, MAX_RATE, MIN_RATE, MS_PER_DAY } from './constants'
import type { ClockAction, ClockState } from './types'

export const INITIAL_CLOCK_STATE: ClockState = {
  jdTdb: J2000_JD_TDB,
  mode: 'paused',
  rate: DEFAULT_RATE,
  direction: 1,
}

function clampRate(r: number): number {
  if (Number.isNaN(r)) return DEFAULT_RATE
  if (r < MIN_RATE) return MIN_RATE
  if (r > MAX_RATE) return MAX_RATE
  return r
}

export function clockReducer(state: ClockState, action: ClockAction): ClockState {
  switch (action.type) {
    case 'play':
      return state.mode === 'paused'
        ? { ...state, mode: state.rate === 1 ? 'realtime' : 'fast' }
        : state
    case 'pause':
      return { ...state, mode: 'paused' }
    case 'setJdTdb':
      return { ...state, jdTdb: action.jdTdb }
    case 'setRate': {
      const rate = clampRate(action.rate)
      const mode: ClockState['mode'] =
        state.mode === 'paused' ? 'paused' : rate === 1 ? 'realtime' : 'fast'
      return { ...state, rate, mode }
    }
    case 'setDirection':
      return { ...state, direction: action.direction }
    case 'tick': {
      if (state.mode === 'paused' || action.dtMs <= 0) return state
      const deltaDays = (action.dtMs * state.rate * state.direction) / MS_PER_DAY
      return { ...state, jdTdb: ((state.jdTdb as number) + deltaDays) as JdTdb }
    }
  }
}
