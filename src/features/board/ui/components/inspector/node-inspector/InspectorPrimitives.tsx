import { useState, type ReactNode } from 'react'

export function FieldError({ message }: { message?: string }): JSX.Element | null {
  if (!message) return null
  return <p className="field-error">{message}</p>
}

interface InspectorSectionProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function InspectorSection({
  title,
  summary,
  defaultOpen = false,
  children
}: InspectorSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'
  const panelId = `inspector-section-${slug}`

  return (
    <section className="inspector-section">
      <button
        type="button"
        className="inspector-section__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${panelId}-panel`}
        data-ui-log={`Inspector section – Toggle ${title}`}
      >
        <div className="inspector-section__toggle-main">
          <span className="inspector-section__title">{title}</span>
          {summary ? <span className="inspector-section__summary">{summary}</span> : null}
        </div>
        <span className="inspector-section__indicator" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div id={`${panelId}-panel`} className={`inspector-section__panel ${isOpen ? 'is-open' : ''}`}>
        {children}
      </div>
    </section>
  )
}
