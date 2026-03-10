import { FormEvent, useMemo, useState } from 'react'
import { RelationType } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'

const RELATION_TYPES: RelationType[] = [
  'depends_on',
  'calls',
  'reads',
  'writes',
  'implements',
  'extends',
  'uses',
  'exposes',
  'contains',
  'decides'
]

interface RelationPanelProps {
  nodes: SemanticNode[]
  onCreateRelation: (sourceNodeId: string, targetNodeId: string, type: RelationType) => void
}

export function RelationPanel({ nodes, onCreateRelation }: RelationPanelProps): JSX.Element {
  const [sourceNodeId, setSourceNodeId] = useState<string>('')
  const [targetNodeId, setTargetNodeId] = useState<string>('')
  const [relationType, setRelationType] = useState<RelationType>('depends_on')

  const canSubmit = useMemo(
    () => sourceNodeId.length > 0 && targetNodeId.length > 0 && sourceNodeId !== targetNodeId,
    [sourceNodeId, targetNodeId]
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
          {RELATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button type="submit" disabled={!canSubmit}>
          Create relation
        </button>
      </form>
    </div>
  )
}
