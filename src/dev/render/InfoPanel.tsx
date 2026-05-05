import type { SceneAnchor } from '@/render'

interface Props {
  readonly fps: number | null
  readonly logDepth: boolean
  readonly toneMapping: string
  readonly exposure: number
  readonly anchorKind: SceneAnchor
  readonly utcIso: string
}

export default function InfoPanel({
  fps,
  logDepth,
  toneMapping,
  exposure,
  anchorKind,
  utcIso,
}: Props) {
  return (
    <section className="render-panel" aria-labelledby="render-info-title">
      <div className="render-panel__head">
        <p className="render-panel__eyebrow">Panel 4</p>
        <h2 id="render-info-title">Scene Info</h2>
      </div>

      <div className="render-info">
        <div className="render-info__row">
          <span>UTC</span>
          <span>{utcIso}</span>
        </div>
        <div className="render-info__row">
          <span>FPS</span>
          <span data-testid="render-fps">{fps?.toFixed(0) ?? '—'}</span>
        </div>
        <div className="render-info__row">
          <span>Tone mapping</span>
          <span>{toneMapping}</span>
        </div>
        <div className="render-info__row">
          <span>Exposure</span>
          <span>{exposure.toFixed(2)}</span>
        </div>
        <div className="render-info__row">
          <span>Log-depth</span>
          <span>{logDepth ? 'enabled' : 'disabled'}</span>
        </div>
        <div className="render-info__row">
          <span>Anchor</span>
          <span>{anchorKind}</span>
        </div>
      </div>
    </section>
  )
}
