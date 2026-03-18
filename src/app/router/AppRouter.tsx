import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Boxes, FileOutput, Layers, PenTool, ArrowRight } from 'lucide-react'
import { ProjectsPage } from '@/features/project/ui/ProjectsPage'
import { BoardPage } from '@/features/board/ui/BoardPage'

function HomePage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* ---- Top nav ---- */}
      <header className="landing__nav">
        <span className="landing__logo">SpecDiagram</span>
        <button
          type="button"
          className="btn--primary"
          onClick={() => navigate('/projects')}
          data-ui-log="Landing – Open app"
        >
          Open App
        </button>
      </header>

      {/* ---- Hero ---- */}
      <section className="landing__hero">
        <p className="landing__eyebrow">Open-source diagramming for developers</p>
        <h1 className="landing__title">
          Draw diagrams.<br />
          Export specifications.
        </h1>
        <p className="landing__subtitle">
          Design system architecture visually, capture just enough detail, and export structured prompts
          that any LLM can turn into implementation-ready specs.
        </p>
        <div className="landing__hero-actions">
          <button
            type="button"
            className="btn--primary landing__cta"
            onClick={() => navigate('/projects')}
            data-ui-log="Landing – Get started"
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ---- Workflow diagram ---- */}
      <section className="landing__workflow">
        <h2 className="landing__section-title">How it works</h2>
        <div className="landing__flow-steps">
          <div className="landing__flow-step">
            <div className="landing__flow-icon">
              <PenTool size={24} />
            </div>
            <h3>1. Draw</h3>
            <p>Place systems, services, databases, and external actors on an infinite canvas.</p>
          </div>
          <div className="landing__flow-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </div>
          <div className="landing__flow-step">
            <div className="landing__flow-icon">
              <Layers size={24} />
            </div>
            <h3>2. Detail</h3>
            <p>Drill into any block to define classes, interfaces, contracts, and methods.</p>
          </div>
          <div className="landing__flow-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </div>
          <div className="landing__flow-step">
            <div className="landing__flow-icon">
              <FileOutput size={24} />
            </div>
            <h3>3. Export</h3>
            <p>Generate structured prompts ready to paste into any LLM for spec generation.</p>
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section className="landing__features">
        <h2 className="landing__section-title">Built for developer workflows</h2>
        <div className="landing__feature-grid">
          <article className="landing__feature-card">
            <div className="landing__feature-icon">
              <Boxes size={22} />
            </div>
            <h3>Architecture patterns</h3>
            <p>
              Start from Hexagonal, Microservices, MVC, Layered N-Tier, and more — or go free-form.
              Each pattern guides which blocks and relations make sense.
            </p>
          </article>
          <article className="landing__feature-card">
            <div className="landing__feature-icon">
              <Layers size={22} />
            </div>
            <h3>Two-level drill-down</h3>
            <p>
              High-level overview shows the big picture. Click into any block
              to define classes, interfaces, API contracts, methods, and attributes.
            </p>
          </article>
          <article className="landing__feature-card">
            <div className="landing__feature-icon">
              <FileOutput size={22} />
            </div>
            <h3>LLM-ready export</h3>
            <p>
              Export structured markdown prompts per component — including context, relations,
              and code-level details — ready for any AI to generate implementation specs or tasks.
            </p>
          </article>
        </div>
      </section>

      {/* ---- Privacy / local-first ---- */}
      <section className="landing__privacy">
        <h2 className="landing__section-title">Privacy first</h2>
        <p className="landing__privacy-text">
          All data stays in your browser. No accounts, no cloud storage, no tracking.
          Export and import projects as JSON files whenever you need to back up or share.
        </p>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing__footer">
        <p className="landing__disclaimer">
          SpecDiagram is in early alpha — expect rough edges and missing features.
        </p>
        <p className="landing__copyright">
          Open-source project &middot; Built with React, Zustand &amp; React Flow
        </p>
        <p className="landing__copyright">
          A lot of this project was vibecoded, so if you wanna check the spagghetti code go here:
          <a href="https://github.com/duxpe/system-designer-specs-generator-tool" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  )
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/project/:projectId" element={<ProjectsPage />} />
      <Route path="/project/:projectId/board/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
