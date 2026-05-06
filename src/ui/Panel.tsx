import type { PanelProps } from './types'

export default function Panel({ title, eyebrow, children }: PanelProps) {
  return (
    <section className="ui-panel">
      {eyebrow && <p className="ui-panel__eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
