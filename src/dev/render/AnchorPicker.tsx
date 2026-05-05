import { SCENE_ANCHORS, type SceneAnchor } from '@/render'

interface Props {
  readonly anchorKind: SceneAnchor
  readonly bodyNaifId: number
  readonly bodyChoices: readonly { readonly naifId: number; readonly label: string }[]
  readonly anchorReferenceM: readonly [number, number, number] | null
  readonly evaluatorError: string | null
  readonly onAnchorChange: (kind: SceneAnchor) => void
  readonly onBodyChange: (naifId: number) => void
}

export default function AnchorPicker({
  anchorKind,
  bodyNaifId,
  bodyChoices,
  anchorReferenceM,
  evaluatorError,
  onAnchorChange,
  onBodyChange,
}: Props) {
  return (
    <section className="render-panel" aria-labelledby="render-anchor-title">
      <div className="render-panel__head">
        <p className="render-panel__eyebrow">Panel 3</p>
        <h2 id="render-anchor-title">Scene Anchor</h2>
      </div>

      <fieldset className="render-segmented" aria-label="Anchor kind">
        {SCENE_ANCHORS.map((kind) => (
          <label key={kind}>
            <input
              type="radio"
              name="render-anchor"
              value={kind}
              checked={kind === anchorKind}
              onChange={() => onAnchorChange(kind)}
            />
            <span>{kind}</span>
          </label>
        ))}
      </fieldset>

      {anchorKind === 'body-centric' && (
        <label className="render-control">
          <span className="render-control__label">Body</span>
          <select
            aria-label="Body NAIF id"
            value={bodyNaifId}
            onChange={(e) => onBodyChange(Number(e.currentTarget.value))}
          >
            {bodyChoices.map((b) => (
              <option key={b.naifId} value={b.naifId}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="render-info">
        <div className="render-info__row">
          <span>Reference SSB (m)</span>
          <span data-testid="anchor-ref">
            {anchorReferenceM
              ? `[${anchorReferenceM.map((v) => v.toExponential(3)).join(', ')}]`
              : 'origin'}
          </span>
        </div>
        {evaluatorError && <p className="render-error">{evaluatorError}</p>}
      </div>
    </section>
  )
}
