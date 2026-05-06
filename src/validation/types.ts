export interface ValidationSample {
  readonly bodyKey: string
  readonly utcIso: string
  readonly jdTdb: number
  readonly de440PositionM: readonly [number, number, number]
  readonly horizonsPositionM: readonly [number, number, number] | null
  readonly diffMagnitudeM: number | null
  readonly angularErrorMas: number | null
}

export interface ValidationReport {
  readonly generatedAt: string
  readonly source: string
  readonly samples: readonly ValidationSample[]
  readonly summary: {
    readonly bodies: number
    readonly samples: number
    readonly meanDiffM: number | null
    readonly maxDiffM: number | null
    readonly meanAngularMas: number | null
    readonly maxAngularMas: number | null
  }
}
