import { ChangeEvent } from 'react'
import { SemanticNode } from '@/domain/models/semantic-node'

interface NodeInspectorProps {
  node?: SemanticNode
  onUpdateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'workspaceId' | 'boardId'>>) => void
  onOpenDetail: (nodeId: string) => void
}

export function NodeInspector({ node, onUpdateNode, onOpenDetail }: NodeInspectorProps): JSX.Element {
  if (!node) {
    return <div className="panel">Select a node to edit properties.</div>
  }

  const handleFieldChange = (
    field: 'title' | 'description',
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    if (field === 'title') {
      onUpdateNode(node.id, { title: event.target.value })
      return
    }

    onUpdateNode(node.id, { description: event.target.value || undefined })
  }

  return (
    <div className="panel node-inspector">
      <h2>Inspector</h2>

      <label htmlFor="node-title">Title</label>
      <input
        id="node-title"
        type="text"
        value={node.title}
        onChange={(event) => handleFieldChange('title', event)}
      />

      <label htmlFor="node-description">Description</label>
      <textarea
        id="node-description"
        value={node.description ?? ''}
        onChange={(event) => handleFieldChange('description', event)}
      />

      <label htmlFor="node-width">Width</label>
      <input
        id="node-width"
        type="number"
        value={node.width}
        min={120}
        onChange={(event) => {
          const width = Number(event.target.value)
          if (!Number.isFinite(width) || width <= 0) return
          onUpdateNode(node.id, { width })
        }}
      />

      <label htmlFor="node-height">Height</label>
      <input
        id="node-height"
        type="number"
        value={node.height}
        min={70}
        onChange={(event) => {
          const height = Number(event.target.value)
          if (!Number.isFinite(height) || height <= 0) return
          onUpdateNode(node.id, { height })
        }}
      />

      <button type="button" onClick={() => onOpenDetail(node.id)}>
        Open detail
      </button>
    </div>
  )
}
