import { useMemo, useRef } from 'react'
import { ArrowHelper, type Group, Vector3 } from 'three'

import { getIauRotationModel, type JdTdb } from '@/astro'
import {
  Body,
  type BodyDefinition,
  bodyOrientationQuaternion,
  SaturnRings,
  SunMesh,
} from '@/bodies'

interface Props {
  readonly body: BodyDefinition
  readonly jdTdb: JdTdb
  readonly worldRadius: number
  readonly axisVisible: boolean
  readonly ringsVisible: boolean
}

const AXIS_COLOR = 0xffd166

export default function BodyScene({ body, jdTdb, worldRadius, axisVisible, ringsVisible }: Props) {
  const axisGroupRef = useRef<Group>(null)

  const axisLength = worldRadius * 1.5
  const arrows = useMemo(() => {
    const north = new ArrowHelper(
      new Vector3(0, 0, 1),
      new Vector3(0, 0, 0),
      axisLength,
      AXIS_COLOR,
      axisLength * 0.1,
      axisLength * 0.05,
    )
    const south = new ArrowHelper(
      new Vector3(0, 0, -1),
      new Vector3(0, 0, 0),
      axisLength,
      AXIS_COLOR,
      axisLength * 0.1,
      axisLength * 0.05,
    )
    return { north, south }
  }, [axisLength])

  // Sync axis arrows to body orientation
  const model = getIauRotationModel(body.rotationModelKey)
  if (axisGroupRef.current && model) {
    axisGroupRef.current.quaternion.copy(bodyOrientationQuaternion(model, jdTdb))
  }

  const rings = body.rings
  const ringInner = rings ? (rings.innerRadiusM / body.radiusM) * worldRadius : 0
  const ringOuter = rings ? (rings.outerRadiusM / body.radiusM) * worldRadius : 0

  return (
    <>
      {body.kind === 'sun' ? (
        <SunMesh body={body} jdTdb={jdTdb} worldPosition={[0, 0, 0]} worldRadius={worldRadius} />
      ) : (
        <Body body={body} jdTdb={jdTdb} worldPosition={[0, 0, 0]} worldRadius={worldRadius} />
      )}
      {rings && ringsVisible && (
        <SaturnRings
          body={body}
          jdTdb={jdTdb}
          innerWorldRadius={ringInner}
          outerWorldRadius={ringOuter}
          textureUrl={rings.textureUrl}
          worldPosition={[0, 0, 0]}
        />
      )}
      {axisVisible && (
        <group ref={axisGroupRef}>
          <primitive object={arrows.north} />
          <primitive object={arrows.south} />
        </group>
      )}
    </>
  )
}
