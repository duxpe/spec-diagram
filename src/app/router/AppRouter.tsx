import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { WorkspacePage } from '@/pages/workspace/WorkspacePage'
import { BoardPage } from '@/pages/board/BoardPage'

function HomePage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="projects-screen home-page">
      <div className="projects-screen__content home-page__content">
        <section className="home-hero">
          <p className="home-hero__eyebrow">System Designer Specs Generator Tool</p>
          <h1>Generate systems visually</h1>
          <p>
            Generate systems visually, specify only what you need, and export structured prompts to generate specs in any LLM you want.
          </p>
          <button type="button" className="btn--primary home-hero__cta" onClick={() => navigate('/projects')}>
            Go to projects
          </button>
        </section>

        <section className="home-info">
          <article className="home-info__card">
            <h3>Why I Built This Tool</h3>
            <p>
              I started planning a new software project and found myself bored with writing specs.
            </p>
            <p>
              I didn't like the way GitHub's spec kit or other spec tools worked, so I decided to build my own tool to make the process more enjoyable.
            </p>
          </article>

          <article className="home-info__card">
            <h3>Disclaimer</h3>
            <p>
              This project was vibe coded and is still in very early stages of development. Expect bugs, quirks, and unfinished features.
            </p>
          </article>
        </section>
      </div>
    </div>
  )
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<WorkspacePage />} />
      <Route path="/project/:projectId" element={<WorkspacePage />} />
      <Route path="/project/:projectId/board/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
