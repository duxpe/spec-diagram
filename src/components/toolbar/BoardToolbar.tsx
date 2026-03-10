import { FormEvent, useMemo, useState } from 'react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import { SemanticLevel } from '@/domain/models/board'
import { SemanticNodeType } from '@/domain/models/semantic-node'
import { N1_NODE_PALETTE } from '@/domain/semantics/n1-node-palette'
import { N2_NODE_PALETTE } from '@/domain/semantics/n2-node-palette'
import { N3_NODE_PALETTE } from '@/domain/semantics/n3-node-palette'
import { getDefaultAppearance } from '@/domain/semantics/node-visual-catalog'
import { getAllowedNodeTypes } from '@/domain/semantics/semantic-catalog'

interface BoardToolbarProps {
  level: SemanticLevel
  onCreateNode: (type: SemanticNodeType) => void
  onSave: () => void
  onOpenExport: () => void
  onOpenImport: () => void
}

function humanizeType(type: SemanticNodeType): string {
  return type.replaceAll('_', ' ')
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

export function BoardToolbar({
  level,
  onCreateNode,
  onSave,
  onOpenExport,
  onOpenImport
}: BoardToolbarProps): JSX.Element {
  const allowedTypes = useMemo(() => getAllowedNodeTypes(level), [level])
  const [nodeType, setNodeType] = useState<SemanticNodeType>(allowedTypes[0] ?? 'system')
  const [searchTerm, setSearchTerm] = useState('')
  const palette = useMemo(() => getPaletteByLevel(level), [level])

  const filteredPalette = useMemo(() => {
    if (palette.length === 0) return []

    const lowerTerm = searchTerm.trim().toLowerCase()
    return palette.filter((item) => {
      if (!allowedTypes.includes(item.type)) return false
      if (!lowerTerm) return true
      return (
        item.label.toLowerCase().includes(lowerTerm) ||
        item.type.toLowerCase().includes(lowerTerm) ||
        item.group.toLowerCase().includes(lowerTerm)
      )
    })
  }, [allowedTypes, palette, searchTerm])

  const groupedPalette = useMemo(() => {
    const groups: Record<string, typeof filteredPalette> = {}

    for (const item of filteredPalette) {
      const currentGroup = groups[item.group] ?? []
      currentGroup.push(item)
      groups[item.group] = currentGroup
    }

    return Object.entries(groups)
  }, [filteredPalette])

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onCreateNode(nodeType)
  }

  return (
    <div className="board-toolbar panel">
      {palette.length > 0 ? (
        <div className="semantic-picker">
          <label htmlFor="semantic-picker-search" className="board-toolbar__label">
            Search semantic blocks
          </label>
          <input
            id="semantic-picker-search"
            type="search"
            value={searchTerm}
            placeholder="Search by name or type..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {groupedPalette.length === 0 ? (
            <p className="semantic-picker__empty">No block types found for this search.</p>
          ) : (
            groupedPalette.map(([group, items]) => (
              <div key={group} className="semantic-picker__section">
                <h3>{group}</h3>
                <div className="semantic-picker__grid">
                  {items.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      className="semantic-picker__card"
                      onClick={() => onCreateNode(item.type)}
                      aria-label={`Add ${item.label}`}
                    >
                      <span className="semantic-picker__marker" aria-hidden="true">
                        <GenericNodeIcon iconId={getDefaultAppearance(item.type).icon} size={14} />
                      </span>
                      <span className="semantic-picker__label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="board-toolbar__group">
          <label htmlFor="node-type" className="board-toolbar__label">
            Node type
          </label>
          <select
            id="node-type"
            value={nodeType}
            onChange={(event) => setNodeType(event.target.value as SemanticNodeType)}
          >
            {allowedTypes.map((type) => (
              <option key={type} value={type}>
                {humanizeType(type)}
              </option>
            ))}
          </select>
          <button type="submit">Add node</button>
        </form>
      )}

      <div className="board-toolbar__group">
        <button type="button" onClick={onSave}>
          Save (Ctrl+S)
        </button>
        <button type="button" onClick={onOpenExport}>
          Export
        </button>
        <button type="button" onClick={onOpenImport}>
          Import JSON
        </button>
      </div>
    </div>
  )
}
