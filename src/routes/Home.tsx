import './home.css'

import { Canvas } from '@react-three/fiber'
import { Link } from 'react-router-dom'

import { createRendererProps } from '../render'
import FpsOverlay from '../render/FpsOverlay'
import HomeScene from '../render/HomeScene'

const RENDERER_PROPS = createRendererProps()

export default function Home() {
  return (
    <main className="home">
      <Canvas
        className="home__canvas"
        gl={RENDERER_PROPS.gl}
        camera={RENDERER_PROPS.camera}
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
