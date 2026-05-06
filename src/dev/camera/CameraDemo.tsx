import { useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  CAMERA_PRESETS,
  type CameraAction,
  type CameraMode,
  cameraReducer,
  type CameraState,
  DEFAULT_TRANSITION_MS,
  INITIAL_CAMERA_STATE,
  lerpCamera,
} from '@/camera'

const MODES: readonly CameraMode[] = ['free-fly', 'focus', 'follow', 'pov']

export default function CameraDemo() {
  const [state, dispatch] = useReducer<CameraState, [CameraAction]>(
    cameraReducer,
    INITIAL_CAMERA_STATE,
  )
  const [smoothTransition, setSmoothTransition] = useState(true)
  const [animatedState, setAnimatedState] = useState<CameraState>(state)

  // Drive a 1.5 s smoothstep transition whenever `state` changes.
  useEffect(() => {
    if (!smoothTransition) {
      setAnimatedState(state)
      return
    }
    let cancelled = false
    const from = animatedState
    const to = state
    const start = performance.now()
    const step = (now: number) => {
      if (cancelled) return
      const t = Math.min(1, (now - start) / DEFAULT_TRANSITION_MS)
      setAnimatedState(lerpCamera(from, to, t))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, smoothTransition])

  return (
    <main className="camera-demo">
      <header className="camera-demo__header">
        <div>
          <p className="camera-panel__eyebrow">Work 9</p>
          <h1>Camera & Navigation</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="camera-demo__grid">
        <section className="camera-panel">
          <p className="camera-panel__eyebrow">Panel 1</p>
          <h2>Mode</h2>
          <div className="camera-buttons">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                data-active={state.mode === m}
                onClick={() => dispatch({ type: 'setMode', mode: m })}
                aria-label={`Mode ${m}`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <section className="camera-panel">
          <p className="camera-panel__eyebrow">Panel 2</p>
          <h2>Presets</h2>
          <div className="camera-buttons">
            {CAMERA_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => dispatch({ type: 'applyPreset', preset: p.state })}
                aria-label={`Preset ${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="camera-panel">
          <p className="camera-panel__eyebrow">Panel 3</p>
          <h2>Transition</h2>
          <label className="camera-info">
            <input
              type="checkbox"
              aria-label="Smooth transition"
              checked={smoothTransition}
              onChange={(e) => setSmoothTransition(e.currentTarget.checked)}
            />{' '}
            Smooth ({DEFAULT_TRANSITION_MS} ms cubic Hermite)
          </label>
        </section>

        <section className="camera-panel">
          <p className="camera-panel__eyebrow">Panel 4</p>
          <h2>Live State</h2>
          <div className="camera-info">
            <div>
              mode: <strong data-testid="camera-mode">{animatedState.mode}</strong>
            </div>
            <div>
              target:{' '}
              <strong data-testid="camera-target">{animatedState.targetNaifId ?? '—'}</strong>
            </div>
            <div>
              fov: <strong data-testid="camera-fov">{animatedState.fov.toFixed(2)}</strong>
            </div>
            <div>
              position:{' '}
              <strong data-testid="camera-position">
                [{animatedState.position.map((v) => v.toFixed(2)).join(', ')}]
              </strong>
            </div>
            <div>lookAt: [{animatedState.lookAt.map((v) => v.toFixed(2)).join(', ')}]</div>
          </div>
        </section>
      </div>
    </main>
  )
}
