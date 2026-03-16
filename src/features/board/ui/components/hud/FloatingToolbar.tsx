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
import { GenericNodeIcon } from '@/shared/ui/icons/semantic-icons'
import { SemanticLevel } from '@/domain/models/board'
import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/project'
import { N2_NODE_PALETTE } from '@/domain/semantics/n2-node-palette'
import { getDefaultAppearance } from '@/domain/semantics/node-visual-catalog'
import { getPatternN1Palette } from '@/domain/semantics/pattern-n1-palette'

export interface CreateNodeRequest {
  type: SemanticNodeType
  patternRole?: string
  defaultAppearance?: Partial<NodeAppearance>
}

interface FloatingToolbarProps {
  level: SemanticLevel
  architecturePattern?: ArchitecturePattern
  onCreateNode: (request: CreateNodeRequest) => void
  onSave: () => void
  onOpenExport: () => void
  onOpenImport: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}

type ToolbarPaletteItem = {
  type: SemanticNodeType
  label: string
  marker: string
  group: string
  patternRole?: string
  defaultAppearance?: Partial<NodeAppearance>
}

function getPaletteByLevel(
  level: SemanticLevel,
  pattern?: ArchitecturePattern
): ToolbarPaletteItem[] {
  if (level === 'N1') return getPatternN1Palette(pattern)
  if (level === 'N2') return N2_NODE_PALETTE.map((item) => ({ ...item }))
  return []
}

export function FloatingToolbar({
  level,
  architecturePattern,
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

  const palette = useMemo(
    () => getPaletteByLevel(level, architecturePattern),
    [level, architecturePattern]
  )

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

  const handleCreateNode = (item: ToolbarPaletteItem): void => {
    onCreateNode({
      type: item.type,
      patternRole: item.patternRole,
      defaultAppearance: item.defaultAppearance
    })
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
          data-ui-log="Floating toolbar – Selection tool"
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
            data-ui-log="Floating toolbar – Toggle block palette"
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
                      key={item.patternRole ?? item.type}
                      type="button"
                      className="floating-toolbar__submenu-item"
                      onClick={() => handleCreateNode(item)}
                      data-ui-log={`Floating toolbar – Add ${item.label}`}
                    >
                      <GenericNodeIcon
                          iconId={item.defaultAppearance?.icon ?? getDefaultAppearance(item.type).icon}
                          size={16}
                        />
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
          data-ui-log="Floating toolbar – Create relation"
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
            data-ui-log="Floating toolbar – Zoom in"
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
            data-ui-log="Floating toolbar – Zoom out"
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
            data-ui-log="Floating toolbar – Fit view"
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
          data-ui-log="Floating toolbar – Save board"
        >
          <Save size={20} />
        </button>

        <button
          type="button"
          className="floating-toolbar__btn"
          title="Export"
          aria-label="Export project"
          onClick={onOpenExport}
          data-ui-log="Floating toolbar – Export project"
        >
          <Download size={20} />
        </button>

        <button
          type="button"
          className="floating-toolbar__btn"
          title="Import"
          aria-label="Import project"
          onClick={onOpenImport}
          data-ui-log="Floating toolbar – Import project"
        >
          <Upload size={20} />
        </button>
      </div>
    </nav>
  )
}
