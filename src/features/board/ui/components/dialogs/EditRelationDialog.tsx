import { useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { RelationType, Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/project'
import { getAllowedRelationTypes } from '@/domain/semantics/semantic-catalog'
import { getPatternAllowedRelationTypes } from '@/domain/semantics/semantic-catalog'
import { isPatternRelationTypeAllowed } from '@/domain/semantics/semantic-catalog'
import type { SemanticLevel } from '@/domain/models/board'

interface EditRelationDialogProps {
  relation: Relation
  nodes: SemanticNode[]
  level: SemanticLevel
  architecturePattern?: ArchitecturePattern
  onSave: (patch: { type?: RelationType; label?: string }, reverse: boolean) => void
  onClose: () => void
}

function humanize(type: string): string {
  return type.replace(/_/g, ' ')
}

export function EditRelationDialog({
  relation,
  nodes,
  level,
  architecturePattern,
  onSave,
  onClose
}: EditRelationDialogProps): JSX.Element {
  const [type, setType] = useState<RelationType>(relation.type)
  const [label, setLabel] = useState(relation.label ?? '')
  const [reversed, setReversed] = useState(false)

  const sourceNode = nodes.find((n) => n.id === (reversed ? relation.targetNodeId : relation.sourceNodeId))
  const targetNode = nodes.find((n) => n.id === (reversed ? relation.sourceNodeId : relation.targetNodeId))

  const allowedTypes = (() => {
    if (architecturePattern && level === 'N1') {
      const sourceRole = sourceNode?.patternRole
      const targetRole = targetNode?.patternRole
      return getPatternAllowedRelationTypes(architecturePattern, sourceRole, targetRole).filter((type) =>
        isPatternRelationTypeAllowed(architecturePattern, type, sourceRole, targetRole)
      )
    }
    return getAllowedRelationTypes(level)
  })()

  useEffect(() => {
    if (!allowedTypes.includes(type) && allowedTypes.length > 0) {
      const nextType = allowedTypes[0]
      if (nextType) {
        setType(nextType)
      }
    }
  }, [reversed, allowedTypes, type])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const patch: { type?: RelationType; label?: string } = {}
    if (type !== relation.type) patch.type = type
    if (label !== (relation.label ?? '')) patch.label = label
    onSave(patch, reversed)
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-card"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-card__header">
          <h2>Edit Relation</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: 'var(--accent-soft)',
              fontSize: '0.82rem',
              fontWeight: 500
            }}>
              {sourceNode?.title ?? 'Unknown'}
            </span>

            <button
              type="button"
              onClick={() => setReversed(!reversed)}
              title="Reverse direction"
              data-ui-log="Edit relation dialog – Reverse direction"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                border: '1px solid var(--stroke-light)',
                borderRadius: 6,
                background: reversed ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <ArrowLeftRight size={16} />
            </button>

            <span style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: 'var(--accent-soft)',
              fontSize: '0.82rem',
              fontWeight: 500
            }}>
              {targetNode?.title ?? 'Unknown'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RelationType)}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              >
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              Label (optional)
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Custom label..."
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div className="dialog-card__actions">
            <button type="button" onClick={onClose} data-ui-log="Edit relation dialog – Cancel">
              Cancel
            </button>
            <button type="submit" className="btn--primary" data-ui-log="Edit relation dialog – Save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
