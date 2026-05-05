import { Link } from 'react-router-dom'

import DevCard from './DevCard'
import { devPages } from './registry'

export default function DevIndex() {
  return (
    <main className="dev-index">
      <header className="dev-index__header">
        <h1>Dev Catalog</h1>
        <p>
          Work별 검증 페이지. 각 Work 진행 시 카드가 link로 활성화됨. <Link to="/">← Home</Link>
        </p>
      </header>
      <ul className="dev-cards">
        {devPages.map((page) => (
          <li key={`${page.workNumber}-${page.slug}`}>
            <DevCard entry={page} />
          </li>
        ))}
      </ul>
    </main>
  )
}
