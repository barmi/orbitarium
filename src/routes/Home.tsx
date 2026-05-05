import './home.css'

import { Canvas } from '@react-three/fiber'
import { Link } from 'react-router-dom'

import FpsOverlay from '../render/FpsOverlay'
import HomeScene from '../render/HomeScene'

export default function Home() {
  return (
    <main className="home">
      <Canvas
        className="home__canvas"
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
      >
        <HomeScene />
      </Canvas>
      <header className="home__header">
        <h1>Orbitarium</h1>
        <p>A real-position solar system simulator powered by ephemeris data.</p>
        <p className="home__phase">Work 1 — Phase 4 (three.js hello)</p>
      </header>
      <FpsOverlay className="home__fps" />
      {import.meta.env.DEV && (
        <nav className="home__dev-nav">
          <Link to="/dev/index">→ /dev/index</Link>
        </nav>
      )}
    </main>
  )
}
