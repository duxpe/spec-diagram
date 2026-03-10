import { FormEvent, useEffect, useMemo, useState } from 'react'
import { SemanticLevel } from '@/domain/models/board'
import { RelationType } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import {
  getAllowedRelationTypes,
  getN1RelationSuggestion
} from '@/domain/semantics/semantic-catalog'

interface RelationPanelProps {
  level: SemanticLevel
  nodes: SemanticNode[]
  onCreateRelation: (sourceNodeId: string, targetNodeId: string, type: RelationType) => void
}

function humanizeRelationType(type: RelationType): string {
  return type.replaceAll('_', ' ')
}

export function RelationPanel({ level, nodes, onCreateRelation }: RelationPanelProps): JSX.Element {
  const [sourceNodeId, setSourceNodeId] = useState<string>('')
  const [targetNodeId, setTargetNodeId] = useState<string>('')
  const relationTypes = useMemo(() => getAllowedRelationTypes(level), [level])
  const [relationType, setRelationType] = useState<RelationType>(relationTypes[0] ?? 'depends_on')

  useEffect(() => {
    if (relationTypes.includes(relationType)) return
    setRelationType(relationTypes[0] ?? 'depends_on')
  }, [relationType, relationTypes])

  const sourceNode = nodes.find((node) => node.id === sourceNodeId)
  const targetNode = nodes.find((node) => node.id === targetNodeId)

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

        <button type="submit" disabled={!canSubmit}>
          Create relation
        </button>
      </form>
    </div>
  )
}
