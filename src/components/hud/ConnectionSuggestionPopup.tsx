import { useEffect, useRef, useState } from 'react'
import type { ConnectionSuggestion } from '@/domain/semantics/connection-suggestion-engine'

interface ConnectionSuggestionPopupProps {
  position: { x: number; y: number }
  suggestions: ConnectionSuggestion[]
  onSelect: (suggestion: ConnectionSuggestion) => void
  onClose: () => void
}

export function ConnectionSuggestionPopup({
  position,
  suggestions,
  onSelect,
  onClose
}: ConnectionSuggestionPopupProps): JSX.Element {
  const popupRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const filtered = filter
    ? suggestions.filter((s) => s.label.toLowerCase().includes(filter.toLowerCase()))
    : suggestions

  return (
    <div
      ref={popupRef}
      className="connection-suggestion-popup"
      style={{ left: position.x, top: position.y }}
    >
      <input
        type="text"
        className="connection-suggestion-popup__search"
        placeholder="Filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />
      {filtered.length === 0 ? (
        <p className="connection-suggestion-popup__empty">No matching nodes</p>
      ) : (
        <ul className="connection-suggestion-popup__list">
          {filtered.map((suggestion) => (
            <li key={suggestion.patternRole}>
              <button
                type="button"
                className="connection-suggestion-popup__item"
                onClick={() => onSelect(suggestion)}
              >
                <span className="connection-suggestion-popup__marker">{suggestion.marker}</span>
                <span className="connection-suggestion-popup__label">{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
