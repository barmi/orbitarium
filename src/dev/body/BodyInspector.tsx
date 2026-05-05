import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  evaluateRotation,
  getIauRotationModel,
  type IAURotationModel,
  inertialToBodyFixed,
  type JdTdb,
  utcToJdTdb,
} from '@/astro'
import type { BodyDefinition } from '@/bodies'
import { createRendererProps, RENDER_DEFAULTS } from '@/render'

import BodyPicker from './BodyPicker'
import MeshControls from './MeshControls'
import RotationReadout from './RotationReadout'
import BodyScene from './scene/BodyScene'
import TimeControl from './TimeControl'

interface Props {
  readonly body: BodyDefinition
}

const BASE_UTC = new Date('2026-05-06T00:00:00Z')
const MS_PER_DAY = 86_400_000

// Sub-solar geometry: pretend Sun sits 1 AU in the +X ICRF direction relative
// to the body. Avoids DE440 dependency for the dev demo (Work 9 / Work 11
// will wire real ephemeris).
const AU_M = 149_597_870_700
const SUN_MINUS_BODY: readonly [number, number, number] = [-AU_M, 0, 0]

function applyMatrix3Vector(
  m: readonly number[],
  v: readonly [number, number, number],
): [number, number, number] {
  return [
    m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2],
    m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2],
    m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2],
  ]
}

function computeSubSolar(model: IAURotationModel, jdTdb: JdTdb): { lon: number; lat: number } {
  const m = inertialToBodyFixed(model, jdTdb)
  const [bx, by, bz] = applyMatrix3Vector(m, SUN_MINUS_BODY)
  const norm = Math.sqrt(bx * bx + by * by + bz * bz)
  if (norm === 0) return { lon: 0, lat: 0 }
  const nx = bx / norm
  const ny = by / norm
  const nz = bz / norm
  const lon = (Math.atan2(ny, nx) * 180) / Math.PI
  const lat = (Math.asin(Math.max(-1, Math.min(1, nz))) * 180) / Math.PI
  return { lon, lat }
}

function subSolarLonLat(bodyKey: string, jdTdb: JdTdb): { lon: number | null; lat: number | null } {
  const model = getIauRotationModel(bodyKey)
  if (!model) return { lon: null, lat: null }
  return computeSubSolar(model, jdTdb)
}

// World radius in scene units (1 unit = body radius for camera framing).
const WORLD_RADIUS = 1

const RENDERER_PROPS = createRendererProps(
  { ...RENDER_DEFAULTS, logarithmicDepthBuffer: false },
  { fov: 45, near: 0.05, far: 200, position: [WORLD_RADIUS * 5, WORLD_RADIUS, WORLD_RADIUS * 5] },
)

export default function BodyInspector({ body }: Props) {
  const [daysOffset, setDaysOffset] = useState(0)
  const [textureEnabled, setTextureEnabled] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [axisVisible, setAxisVisible] = useState(true)
  const [ringsVisible, setRingsVisible] = useState(true)

  const utcDate = useMemo(
    () => new Date(BASE_UTC.getTime() + daysOffset * MS_PER_DAY),
    [daysOffset],
  )
  const jdTdb = useMemo(() => utcToJdTdb(utcDate), [utcDate])

  const rotationAngles = useMemo(() => {
    const model = getIauRotationModel(body.rotationModelKey)
    if (!model) return null
    return evaluateRotation(model, jdTdb)
  }, [body.rotationModelKey, jdTdb])

  const subSolar = useMemo(
    () => subSolarLonLat(body.rotationModelKey, jdTdb),
    [body.rotationModelKey, jdTdb],
  )

  const utcIso = utcDate.toISOString().replace('.000Z', 'Z')
  const ringsAvailable = body.rings !== null

  // textureEnabled / wireframe are tracked but applied via a key remount of the
  // mesh subtree (cheap; 19 bodies). Pass a derived BodyDefinition.
  const effectiveBody: BodyDefinition = useMemo(
    () => (textureEnabled ? body : { ...body, textureUrl: null }),
    [body, textureEnabled],
  )

  return (
    <main className="body-demo">
      <header className="body-demo__header">
        <div>
          <p className="body-panel__eyebrow">Work 6</p>
          <h1>{body.label}</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="body-demo__grid">
        <BodyPicker currentSlug={body.slug} />
        <TimeControl utcIso={utcIso} daysOffset={daysOffset} onDaysOffsetChange={setDaysOffset} />
        <RotationReadout
          raDeg={rotationAngles?.raDeg ?? null}
          decDeg={rotationAngles?.decDeg ?? null}
          wDeg={rotationAngles?.wDeg ?? null}
          subSolarLonDeg={subSolar.lon}
          subSolarLatDeg={subSolar.lat}
        />
        <MeshControls
          textureEnabled={textureEnabled}
          wireframe={wireframe}
          axisVisible={axisVisible}
          ringsAvailable={ringsAvailable}
          ringsVisible={ringsVisible}
          onTextureToggle={setTextureEnabled}
          onWireframeToggle={setWireframe}
          onAxisToggle={setAxisVisible}
          onRingsToggle={setRingsVisible}
        />

        <section className="body-demo__canvas-panel" data-testid="body-canvas-panel">
          <Canvas gl={RENDERER_PROPS.gl} camera={RENDERER_PROPS.camera} dpr={[1, 2]}>
            <ambientLight intensity={RENDER_DEFAULTS.ambientIntensity} />
            <pointLight
              position={[WORLD_RADIUS * 10, WORLD_RADIUS * 5, WORLD_RADIUS * 10]}
              intensity={RENDER_DEFAULTS.sunIntensity}
              decay={0}
            />
            <BodyScene
              body={effectiveBody}
              jdTdb={jdTdb}
              worldRadius={WORLD_RADIUS}
              axisVisible={axisVisible}
              ringsVisible={ringsVisible}
            />
          </Canvas>
          <div className="body-demo__overlay">
            <strong data-testid="overlay-slug">{body.slug}</strong> · {wireframe ? 'wire' : 'solid'}{' '}
            · {textureEnabled ? 'texture' : 'fallback'}
          </div>
        </section>
      </div>
    </main>
  )
}
