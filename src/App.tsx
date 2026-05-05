import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import Home from './routes/Home'

const enableDevRoutes = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true'

const DevApp = enableDevRoutes ? lazy(() => import('./dev/DevApp')) : null

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {DevApp && (
        <Route
          path="/dev/*"
          element={
            <Suspense fallback={null}>
              <DevApp />
            </Suspense>
          }
        />
      )}
    </Routes>
  )
}
