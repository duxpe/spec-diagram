import { useState, useRef, useEffect, useMemo } from 'react'
import {
  MousePointer2,
  Shapes,
  Save,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2
} from 'lucide-react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import { SemanticLevel } from '@/domain/models/board'
import { SemanticNodeType } from '@/domain/models/semantic-node'
import { N1_NODE_PALETTE } from '@/domain/semantics/n1-node-palette'
import { N2_NODE_PALETTE } from '@/domain/semantics/n2-node-palette'
import { N3_NODE_PALETTE } from '@/domain/semantics/n3-node-palette'
import { getDefaultAppearance } from '@/domain/semantics/node-visual-catalog'

interface FloatingToolbarProps {
  level: SemanticLevel
  onCreateNode: (type: SemanticNodeType) => void
  onSave: () => void
  onOpenExport: () => void
  onOpenImport: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}

function getPaletteByLevel(level: SemanticLevel): Array<{
  type: SemanticNodeType
  label: string
  marker: string
  group: string
}> {
  if (level === 'N1') return N1_NODE_PALETTE
  if (level === 'N2') return N2_NODE_PALETTE
  if (level === 'N3') return N3_NODE_PALETTE
  return []
}

export function FloatingToolbar({
  level,
  onCreateNode,
  onSave,
  onOpenExport,
  onOpenImport,
  onZoomIn,
  onZoomOut,
  onFitView
}: FloatingToolbarProps): JSX.Element {
  const [isShapesOpen, setIsShapesOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const submenuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const palette = useMemo(() => getPaletteByLevel(level), [level])

  const filteredPalette = useMemo(() => {
    const lowerTerm = searchTerm.trim().toLowerCase()
    return palette.filter((item) => {
      if (!lowerTerm) return true
      return (
        item.label.toLowerCase().includes(lowerTerm) ||
        item.type.toLowerCase().includes(lowerTerm) ||
        item.group.toLowerCase().includes(lowerTerm)
      )
    })
  }, [palette, searchTerm])

  const groupedPalette = useMemo(() => {
    const groups: Record<string, typeof filteredPalette> = {}

    for (const item of filteredPalette) {
      const currentGroup = groups[item.group] ?? []
      currentGroup.push(item)
      groups[item.group] = currentGroup
    }

    return Object.entries(groups)
  }, [filteredPalette])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        submenuRef.current &&
        buttonRef.current &&
        !submenuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsShapesOpen(false)
      }
    }

    if (isShapesOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isShapesOpen])

  const handleCreateNode = (type: SemanticNodeType): void => {
    onCreateNode(type)
    setIsShapesOpen(false)
    setSearchTerm('')
  }

  return (
    <nav className="floating-toolbar" aria-label="Board tools">
      <div className="floating-toolbar__section">
        <button
          type="button"
          className="floating-toolbar__btn active"
          title="Select (V)"
          aria-label="Selection tool"
        >
          <MousePointer2 size={20} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            ref={buttonRef}
            type="button"
            className={`floating-toolbar__btn ${isShapesOpen ? 'active' : ''}`}
            title="Add semantic block"
            aria-label="Add semantic block"
            aria-expanded={isShapesOpen}
            onClick={() => setIsShapesOpen(!isShapesOpen)}
          >
            <Shapes size={20} />
            {palette.length > 0 && <span className="floating-toolbar__btn-badge" />}
          </button>

          {isShapesOpen && (
            <div
              ref={submenuRef}
              className="floating-toolbar__submenu open"
              style={{ maxHeight: 'calc(100dvh - 200px)', overflowY: 'auto' }}
            >
              <input
                type="search"
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />

              {groupedPalette.length === 0 ? (
                <p style={{ margin: 0, padding: '8px', fontSize: '0.84rem', color: 'var(--muted)' }}>
                  No blocks found
                </p>
              ) : (
                groupedPalette.map(([group, items]) => (
                  <div key={group} style={{ marginBottom: '8px' }}>
                    <h4 className="floating-toolbar__submenu-title">{group}</h4>
                    {items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        className="floating-toolbar__submenu-item"
                        onClick={() => handleCreateNode(item.type)}
                      >
                        <GenericNodeIcon iconId={getDefaultAppearance(item.type).icon} size={16} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="floating-toolbar__btn"
          title="Create relation"
          aria-label="Create relation between nodes"
        >
          <Link2 size={20} />
        </button>
      </div>

      <div className="floating-toolbar__divider" />

      <div className="floating-toolbar__section">
        {onZoomIn && (
          <button
            type="button"
            className="floating-toolbar__btn"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={onZoomIn}
          >
            <ZoomIn size={20} />
          </button>
        )}

        {onZoomOut && (
          <button
            type="button"
            className="floating-toolbar__btn"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={onZoomOut}
          >
            <ZoomOut size={20} />
          </button>
        )}

        {onFitView && (
          <button
            type="button"
            className="floating-toolbar__btn"
            title="Fit view"
            aria-label="Fit view"
            onClick={onFitView}
          >
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      <div className="floating-toolbar__divider" />

      <div className="floating-toolbar__section">
        <button
          type="button"
          className="floating-toolbar__btn"
          title="Save (Ctrl+S)"
          aria-label="Save board"
          onClick={onSave}
        >
          <Save size={20} />
        </button>

        <button
          type="button"
          className="floating-toolbar__btn"
          title="Export"
          aria-label="Export workspace"
          onClick={onOpenExport}
        >
          <Download size={20} />
        </button>

        <button
          type="button"
          className="floating-toolbar__btn"
          title="Import"
          aria-label="Import workspace"
          onClick={onOpenImport}
        >
          <Upload size={20} />
        </button>
      </div>
    </nav>
  )
}
