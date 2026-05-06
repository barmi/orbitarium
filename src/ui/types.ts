import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost'

export interface ButtonProps {
  readonly children: ReactNode
  readonly variant?: ButtonVariant
  readonly disabled?: boolean
  readonly onClick?: () => void
  readonly ariaLabel?: string
  readonly testId?: string
}

export interface SliderProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step?: number
  readonly format?: (v: number) => string
  readonly onChange: (v: number) => void
  readonly testId?: string
}

export interface PanelProps {
  readonly title: string
  readonly eyebrow?: string
  readonly children: ReactNode
}

export interface BodyChipProps {
  readonly slug: string
  readonly label: string
  readonly active?: boolean
  readonly onClick?: () => void
  readonly testId?: string
}

export interface TimeScrubberProps {
  readonly jdTdb: number
  readonly minJd: number
  readonly maxJd: number
  readonly onJdChange: (jd: number) => void
}
