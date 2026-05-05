import './dev.css'

import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import DevIndex from './DevIndex'
import { devPages } from './registry'

export default function DevApp() {
  return (
    <Routes>
      <Route index element={<DevIndex />} />
      <Route path="index" element={<DevIndex />} />
      {devPages.map((page) => {
        const C = page.Component
        if (!C) return null
        return (
          <Route
            key={page.slug}
            path={page.slug}
            element={
              <Suspense fallback={<p className="dev-loading">Loading…</p>}>
                <C />
              </Suspense>
            }
          />
        )
      })}
      <Route
        path="*"
        element={
          <main className="dev-index">
            <p>Not found.</p>
          </main>
        }
      />
    </Routes>
  )
}
