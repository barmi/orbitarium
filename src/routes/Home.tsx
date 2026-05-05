import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="app">
      <h1>Orbitarium</h1>
      <p>A real-position solar system simulator powered by ephemeris data.</p>
      <p className="note">Work 1 — Phase 3 (app shell &amp; dev routes)</p>
      {import.meta.env.DEV && (
        <p className="dev-link">
          <Link to="/dev/index">→ /dev/index</Link>
        </p>
      )}
    </main>
  )
}
