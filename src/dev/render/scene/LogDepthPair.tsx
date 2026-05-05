// Two spheres at vastly different scales to demonstrate the logarithmic depth
// buffer. With log-depth ON, both render without z-fighting; with it OFF and a
// far plane of 1e10, the small foreground sphere typically suffers heavy
// precision loss.
export default function LogDepthPair() {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#9bb6ff" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[1.5e8, 0, -3e8]}>
        <sphereGeometry args={[1e8, 32, 32]} />
        <meshStandardMaterial color="#ffd166" roughness={0.85} metalness={0.0} />
      </mesh>
    </>
  )
}
