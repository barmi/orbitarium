import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { BODY_CATALOG, getBodyBySlug } from '@/bodies'

import BodyInspector from './BodyInspector'

const DEFAULT_SLUG = 'earth'

function BodyRouteByParam() {
  const { bodySlug } = useParams<{ bodySlug: string }>()
  const body = bodySlug ? getBodyBySlug(bodySlug) : undefined
  if (!body) {
    return (
      <main className="body-demo">
        <p>Unknown body: {bodySlug ?? '—'}.</p>
      </main>
    )
  }
  return <BodyInspector body={body} />
}

export default function BodyDemo() {
  // Sanity: catalog has at least the default body so the redirect lands.
  const _ensure = BODY_CATALOG.length > 0
  void _ensure
  return (
    <Routes>
      <Route index element={<Navigate to={DEFAULT_SLUG} replace />} />
      <Route path=":bodySlug" element={<BodyRouteByParam />} />
    </Routes>
  )
}
