import { Link } from 'react-router-dom'

import type { DevPageEntry } from './registry'

interface Props {
  entry: DevPageEntry
}

export default function DevCard({ entry }: Props) {
  const { workNumber, slug, title, summary, Component } = entry
  const isReady = Component != null

  const head = (
    <header>
      <span className="dev-card__num">Work {workNumber}</span>
      <span className="dev-card__status">{isReady ? 'available' : '준비 중'}</span>
    </header>
  )

  const body = (
    <>
      <h2>{title}</h2>
      <p>{summary}</p>
      <code>/dev/{slug}</code>
    </>
  )

  if (isReady) {
    return (
      <Link to={`/dev/${slug}`} className="dev-card" data-status="available">
        {head}
        {body}
      </Link>
    )
  }

  return (
    <article className="dev-card" data-status="placeholder" aria-disabled="true">
      {head}
      {body}
    </article>
  )
}
