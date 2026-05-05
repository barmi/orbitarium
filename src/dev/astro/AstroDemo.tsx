import { Link } from 'react-router-dom'

import EarthRotation from './EarthRotation'
import FrameConverter from './FrameConverter'
import J2000Counter from './J2000Counter'
import TimeConverter from './TimeConverter'

export default function AstroDemo() {
  return (
    <main className="astro-demo">
      <header className="astro-demo__header">
        <div>
          <p className="astro-panel__eyebrow">Work 2</p>
          <h1>Astronomy Foundations</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="astro-demo__grid">
        <TimeConverter />
        <J2000Counter />
        <FrameConverter />
        <EarthRotation />
      </div>
    </main>
  )
}
