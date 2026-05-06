import { useFrame } from '@react-three/fiber'
import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from 'react'

import { clockReducer, INITIAL_CLOCK_STATE } from './clock'
import type { ClockAction, ClockState } from './types'

interface ClockContextValue {
  readonly state: ClockState
  readonly dispatch: Dispatch<ClockAction>
}

const ClockContext = createContext<ClockContextValue | null>(null)

export function SimulationClockProvider({
  children,
  initial,
}: {
  readonly children: ReactNode
  readonly initial?: Partial<ClockState>
}) {
  const [state, dispatch] = useReducer(clockReducer, { ...INITIAL_CLOCK_STATE, ...initial })
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
}

export function useSimulationClock(): ClockContextValue {
  const ctx = useContext(ClockContext)
  if (!ctx) {
    throw new Error('useSimulationClock must be used inside <SimulationClockProvider>')
  }
  return ctx
}

/**
 * Drive the clock from R3F's render loop. Mount this component once inside a
 * `<Canvas>` that lives within `<SimulationClockProvider>`.
 */
export function ClockTickDriver(): null {
  const { dispatch } = useSimulationClock()
  useFrame((_, delta) => {
    dispatch({ type: 'tick', dtMs: delta * 1000 })
  })
  return null
}
