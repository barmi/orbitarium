interface Props {
  readonly textureEnabled: boolean
  readonly wireframe: boolean
  readonly axisVisible: boolean
  readonly ringsAvailable: boolean
  readonly ringsVisible: boolean
  readonly onTextureToggle: (value: boolean) => void
  readonly onWireframeToggle: (value: boolean) => void
  readonly onAxisToggle: (value: boolean) => void
  readonly onRingsToggle: (value: boolean) => void
}

export default function MeshControls({
  textureEnabled,
  wireframe,
  axisVisible,
  ringsAvailable,
  ringsVisible,
  onTextureToggle,
  onWireframeToggle,
  onAxisToggle,
  onRingsToggle,
}: Props) {
  return (
    <section className="body-panel" aria-labelledby="body-mesh-title">
      <div className="body-panel__head">
        <p className="body-panel__eyebrow">Panel 4</p>
        <h2 id="body-mesh-title">Mesh</h2>
      </div>
      <div className="body-checkbox-grid">
        <div className="body-checkbox-row">
          <input
            id="ctl-texture"
            aria-label="Texture toggle"
            type="checkbox"
            checked={textureEnabled}
            onChange={(e) => onTextureToggle(e.currentTarget.checked)}
          />
          <label htmlFor="ctl-texture">Texture</label>
        </div>
        <div className="body-checkbox-row">
          <input
            id="ctl-wireframe"
            aria-label="Wireframe toggle"
            type="checkbox"
            checked={wireframe}
            onChange={(e) => onWireframeToggle(e.currentTarget.checked)}
          />
          <label htmlFor="ctl-wireframe">Wireframe</label>
        </div>
        <div className="body-checkbox-row">
          <input
            id="ctl-axis"
            aria-label="Axis toggle"
            type="checkbox"
            checked={axisVisible}
            onChange={(e) => onAxisToggle(e.currentTarget.checked)}
          />
          <label htmlFor="ctl-axis">Axis</label>
        </div>
        {ringsAvailable && (
          <div className="body-checkbox-row">
            <input
              id="ctl-rings"
              aria-label="Rings toggle"
              type="checkbox"
              checked={ringsVisible}
              onChange={(e) => onRingsToggle(e.currentTarget.checked)}
            />
            <label htmlFor="ctl-rings">Rings</label>
          </div>
        )}
      </div>
    </section>
  )
}
