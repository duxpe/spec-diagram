import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { SemanticLevel } from '@/domain/models/board'
import { RelationType } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/project'
import {
  getAllowedRelationTypes,
  getN1RelationSuggestion,
  getPatternAllowedRelationTypes,
  isPatternRelationTypeAllowed
} from '@/domain/semantics/semantic-catalog'

interface RelationPanelProps {
  level: SemanticLevel
  nodes: SemanticNode[]
  preselectedSourceId?: string
  preselectedTargetId?: string
  architecturePattern?: ArchitecturePattern
  onCreateRelation: (sourceNodeId: string, targetNodeId: string, type: RelationType) => void
}

function humanizeRelationType(type: RelationType): string {
  return type.replaceAll('_', ' ')
}

export function RelationPanel({
  level,
  nodes,
  preselectedSourceId,
  preselectedTargetId,
  architecturePattern,
  onCreateRelation
}: RelationPanelProps): JSX.Element {
  const [sourceNodeId, setSourceNodeId] = useState<string>(preselectedSourceId ?? '')
  const [targetNodeId, setTargetNodeId] = useState<string>(preselectedTargetId ?? '')

  const sourceNode = nodes.find((node) => node.id === sourceNodeId)
  const targetNode = nodes.find((node) => node.id === targetNodeId)

  const relationTypes = useMemo(() => {
    if (architecturePattern && level === 'N1') {
      const sourceRole = sourceNode?.patternRole
      const targetRole = targetNode?.patternRole
      return getPatternAllowedRelationTypes(architecturePattern, sourceRole, targetRole).filter((type) =>
        isPatternRelationTypeAllowed(architecturePattern, type, sourceRole, targetRole)
      )
    }
    return getAllowedRelationTypes(level)
  }, [level, architecturePattern, sourceNode?.patternRole, targetNode?.patternRole])

  const [relationType, setRelationType] = useState<RelationType>(relationTypes[0] ?? 'depends_on')

  useEffect(() => {
    if (relationTypes.includes(relationType)) return
    setRelationType(relationTypes[0] ?? 'depends_on')
  }, [relationType, relationTypes])

  const relationSuggestion = useMemo(() => {
    if (level !== 'N1') return undefined

    return getN1RelationSuggestion(sourceNode?.type, targetNode?.type, relationType)
  }, [level, relationType, sourceNode?.type, targetNode?.type])

  const canSubmit = useMemo(
    () =>
      sourceNodeId.length > 0 &&
      targetNodeId.length > 0 &&
      sourceNodeId !== targetNodeId &&
      relationTypes.includes(relationType),
    [sourceNodeId, targetNodeId, relationType, relationTypes]
  )

  const handleSwapDirection = (): void => {
    const prevSource = sourceNodeId
    setSourceNodeId(targetNodeId)
    setTargetNodeId(prevSource)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!canSubmit) return

    onCreateRelation(sourceNodeId, targetNodeId, relationType)
    setTargetNodeId('')
  }

  return (
    <div className="panel relation-panel">
      <h2>Relations</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="relation-source">Source</label>
        <select
          id="relation-source"
          value={sourceNodeId}
          onChange={(event) => setSourceNodeId(event.target.value)}
        >
          <option value="">Select source</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <button
            type="button"
            onClick={handleSwapDirection}
            title="Swap direction"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              border: '1px solid var(--stroke-light)',
              borderRadius: 6,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.78rem',
              gap: 4
            }}
            data-ui-log="Relation panel – Swap direction"
          >
            <ArrowLeftRight size={14} />
            Swap
          </button>
        </div>

        <label htmlFor="relation-target">Target</label>
        <select
          id="relation-target"
          value={targetNodeId}
          onChange={(event) => setTargetNodeId(event.target.value)}
        >
          <option value="">Select target</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>

        <label htmlFor="relation-type">Type</label>
        <select
          id="relation-type"
          value={relationType}
          onChange={(event) => setRelationType(event.target.value as RelationType)}
        >
          {relationTypes.map((type) => (
            <option key={type} value={type}>
              {humanizeRelationType(type)}
            </option>
          ))}
        </select>

        {relationSuggestion ? <p className="relation-panel__hint">{relationSuggestion}</p> : null}

        <button type="submit" disabled={!canSubmit} data-ui-log="Relation panel – Create relation">
          Create relation
        </button>
      </form>
    </div>
  )
}
