import { canOpenDetail } from '@/domain/semantics/semantic-catalog'
import type { SemanticNode } from '@/domain/models/semantic-node'

interface InspectorActionsProps {
  node: SemanticNode
  onEditInternals?: (nodeId: string) => void
  onOpenDetail: (nodeId: string) => void
}

export function InspectorActions({
  node,
  onEditInternals,
  onOpenDetail
}: InspectorActionsProps): JSX.Element {
  return (
    <>
      {node.level === 'N2' && ['class', 'interface', 'api_contract'].includes(node.type) && onEditInternals ? (
        <button type="button" onClick={() => onEditInternals(node.id)} data-ui-log="Inspector – Edit internals">
          Edit internals
        </button>
      ) : null}

      {canOpenDetail(node) ? (
        <button type="button" onClick={() => onOpenDetail(node.id)} data-ui-log="Inspector – Open detail board">
          Open detail
        </button>
      ) : null}
    </>
  )
}
