import { Vector3 } from 'three'

interface Props {
  readonly anchorKind: 'ssb' | 'heliocentric' | 'body-centric'
}

export default function AnchorMarker({ anchorKind }: Props) {
  const color =
    anchorKind === 'ssb' ? '#7be4a3' : anchorKind === 'heliocentric' ? '#ffe066' : '#ff8e8e'
  return (
    <mesh position={new Vector3(0, 2, 0)}>
      <octahedronGeometry args={[0.18]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}
