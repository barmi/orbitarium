import { EXPOSURE_MAX, EXPOSURE_MIN, TONE_MAPPING_NAMES, type ToneMappingName } from '@/render'

interface Props {
  readonly exposure: number
  readonly toneMapping: ToneMappingName
  readonly logDepth: boolean
  readonly onExposureChange: (value: number) => void
  readonly onToneMappingChange: (value: ToneMappingName) => void
  readonly onLogDepthChange: (value: boolean) => void
}

export default function RendererControls({
  exposure,
  toneMapping,
  logDepth,
  onExposureChange,
  onToneMappingChange,
  onLogDepthChange,
}: Props) {
  return (
    <section className="render-panel" aria-labelledby="render-controls-title">
      <div className="render-panel__head">
        <p className="render-panel__eyebrow">Panel 1</p>
        <h2 id="render-controls-title">Renderer</h2>
      </div>

      <label className="render-control">
        <span className="render-control__label">
          Exposure <strong data-testid="exposure-value">{exposure.toFixed(2)}</strong>
        </span>
        <input
          aria-label="Tone mapping exposure"
          type="range"
          min={EXPOSURE_MIN}
          max={EXPOSURE_MAX}
          step={0.05}
          value={exposure}
          onChange={(e) => onExposureChange(Number(e.currentTarget.value))}
        />
      </label>

      <label className="render-control">
        <span className="render-control__label">Tone mapping</span>
        <select
          aria-label="Tone mapping"
          value={toneMapping}
          onChange={(e) => onToneMappingChange(e.currentTarget.value as ToneMappingName)}
        >
          {TONE_MAPPING_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="render-control">
        <span className="render-control__label">
          Logarithmic depth buffer{' '}
          <strong data-testid="log-depth-value">{logDepth ? 'ON' : 'OFF'}</strong>
        </span>
        <input
          aria-label="Logarithmic depth buffer"
          type="checkbox"
          checked={logDepth}
          onChange={(e) => onLogDepthChange(e.currentTarget.checked)}
        />
      </label>
    </section>
  )
}
