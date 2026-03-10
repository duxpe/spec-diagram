import { FormEvent, useState } from 'react'
import { SemanticNodeType } from '@/domain/models/semantic-node'

const NODE_TYPES: SemanticNodeType[] = [
  'system',
  'container_service',
  'database',
  'external_system',
  'api_contract',
  'decision',
  'class',
  'interface',
  'port',
  'adapter',
  'method',
  'attribute',
  'free_note_input',
  'free_note_output'
]

interface BoardToolbarProps {
  onCreateNode: (type: SemanticNodeType) => void
  onSave: () => void
  onOpenExport: () => void
}

export function BoardToolbar({ onCreateNode, onSave, onOpenExport }: BoardToolbarProps): JSX.Element {
  const [nodeType, setNodeType] = useState<SemanticNodeType>('system')

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onCreateNode(nodeType)
  }

  return (
    <div className="board-toolbar">
      <form onSubmit={handleSubmit} className="board-toolbar__group">
        <label htmlFor="node-type" className="board-toolbar__label">
          Node type
        </label>
        <select
          id="node-type"
          value={nodeType}
          onChange={(event) => setNodeType(event.target.value as SemanticNodeType)}
        >
          {NODE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button type="submit">Add node</button>
      </form>

      <div className="board-toolbar__group">
        <button type="button" onClick={onSave}>
          Save (Ctrl+S)
        </button>
        <button type="button" onClick={onOpenExport}>
          Export JSON
        </button>
      </div>
    </div>
  )
}
