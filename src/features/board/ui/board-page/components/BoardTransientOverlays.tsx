import { canOpenDetail } from '@/domain/semantics/semantic-catalog'
import {
  getConnectionSuggestions,
  type ConnectionSuggestion
} from '@/domain/semantics/connection-suggestion-engine'
import { shouldSkipNodeMeaningCapture } from '@/domain/semantics/meaning-capture'
import { resolveDefaultNodeTitle } from '@/domain/services/board-service'
import type { ArchitecturePattern } from '@/domain/models/project'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { Relation, RelationType } from '@/domain/models/relation'
import type { SemanticLevel } from '@/domain/models/board'
import { ConnectionSuggestionPopup } from '@/features/board/ui/components/hud/ConnectionSuggestionPopup'
import { EdgeActionMenu } from '@/features/board/ui/components/hud/EdgeActionMenu'
import { NodeActionMenu } from '@/features/board/ui/components/hud/NodeActionMenu'
import { EditRelationDialog } from '@/features/board/ui/components/dialogs/EditRelationDialog'
import { RelationPanel } from '@/features/board/ui/components/panels/RelationPanel'
import type {
  ConnectionSuggestionState,
  PendingNodeCreation,
  PendingRelationState
} from '@/features/board/ui/board-page/types'

interface BoardTransientOverlaysProps {
  selectedNodeId?: string
  selectedNode?: SemanticNode
  nodeMenuPos: { x: number; y: number } | null
  appearanceDialogNodeId?: string
  onCloseNodeMenu: () => void
  onDeleteSelectedNode: () => void
  onDuplicateSelectedNode: () => Promise<void>
  onOpenSelectedDetail: () => void
  onEditSelectedInternals: () => void
  edgeMenuState: { edgeId: string; x: number; y: number } | null
  setEdgeMenuState: (value: { edgeId: string; x: number; y: number } | null) => void
  editingRelationId: string | null
  setEditingRelationId: (value: string | null) => void
  relations: Relation[]
  nodes: SemanticNode[]
  currentBoardLevel: SemanticLevel
  architecturePattern?: ArchitecturePattern
  updateRelation: (id: string, patch: { type?: RelationType; label?: string }) => void
  reverseRelation: (id: string) => void
  deleteRelation: (id: string) => void
  connectionSuggestionState: ConnectionSuggestionState | null
  setConnectionSuggestionState: (value: ConnectionSuggestionState | null) => void
  createNode: (input: {
    type?: SemanticNode['type']
    patternRole?: string
    defaultAppearance?: Partial<SemanticNode['appearance']>
    title?: string
    description?: string
    meaning?: SemanticNode['meaning']
    meaningDraft?: {
      title: string
      purpose: string
      role: string
      summary: string
      inputs: string
      outputs: string
      constraints: string
      decisionNote: string
      errorNote: string
    }
    x?: number
    y?: number
  }) => SemanticNode | undefined
  createRelation: (
    sourceNodeId: string,
    targetNodeId: string,
    type?: RelationType,
    label?: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  handleNodeSelect: (nodeId?: string) => void
  setPendingNodeCreation: (value: PendingNodeCreation | null) => void
  pendingRelation: PendingRelationState | null
  setPendingRelation: (value: PendingRelationState | null) => void
}

export function BoardTransientOverlays({
  selectedNodeId,
  selectedNode,
  nodeMenuPos,
  appearanceDialogNodeId,
  onCloseNodeMenu,
  onDeleteSelectedNode,
  onDuplicateSelectedNode,
  onOpenSelectedDetail,
  onEditSelectedInternals,
  edgeMenuState,
  setEdgeMenuState,
  editingRelationId,
  setEditingRelationId,
  relations,
  nodes,
  currentBoardLevel,
  architecturePattern,
  updateRelation,
  reverseRelation,
  deleteRelation,
  connectionSuggestionState,
  setConnectionSuggestionState,
  createNode,
  createRelation,
  handleNodeSelect,
  setPendingNodeCreation,
  pendingRelation,
  setPendingRelation
}: BoardTransientOverlaysProps): JSX.Element {
  const canEditSelectedInternals =
    !!selectedNode &&
    selectedNode.level === 'N2' &&
    ['class', 'interface', 'api_contract'].includes(selectedNode.type)
  const canOpenSelectedDetail = selectedNode ? canOpenDetail(selectedNode) : false
  const canShowSecondaryAction = canOpenSelectedDetail || canEditSelectedInternals
  const secondaryActionLabel = canEditSelectedInternals ? 'Edit internals' : 'Open detail board'

  return (
    <>
      {selectedNodeId && nodeMenuPos && !appearanceDialogNodeId ? (
        <NodeActionMenu
          position={nodeMenuPos}
          canShowSecondaryAction={canShowSecondaryAction}
          secondaryActionLabel={secondaryActionLabel}
          onDuplicate={async () => {
            onCloseNodeMenu()
            await onDuplicateSelectedNode()
          }}
          onSecondaryAction={() => {
            onCloseNodeMenu()
            if (canEditSelectedInternals) {
              onEditSelectedInternals()
              return
            }
            onOpenSelectedDetail()
          }}
          onDelete={onDeleteSelectedNode}
        />
      ) : null}

      {edgeMenuState ? (
        <EdgeActionMenu
          position={{ x: edgeMenuState.x, y: edgeMenuState.y }}
          onEdit={() => {
            setEditingRelationId(edgeMenuState.edgeId)
            setEdgeMenuState(null)
          }}
          onReverse={() => {
            reverseRelation(edgeMenuState.edgeId)
            setEdgeMenuState(null)
          }}
          onDelete={() => {
            deleteRelation(edgeMenuState.edgeId)
            setEdgeMenuState(null)
          }}
          onClose={() => setEdgeMenuState(null)}
        />
      ) : null}

      {editingRelationId ? (() => {
        const editingRelation = relations.find((r) => r.id === editingRelationId)
        if (!editingRelation) return null
        return (
          <EditRelationDialog
            relation={editingRelation}
            nodes={nodes}
            level={currentBoardLevel}
            architecturePattern={architecturePattern}
            onSave={(patch, reverse) => {
              if (Object.keys(patch).length > 0) {
                updateRelation(editingRelationId, patch)
              }
              if (reverse) {
                reverseRelation(editingRelationId)
              }
              setEditingRelationId(null)
            }}
            onClose={() => setEditingRelationId(null)}
          />
        )
      })() : null}

      {connectionSuggestionState ? (() => {
        const sourceNode = nodes.find((n) => n.id === connectionSuggestionState.sourceNodeId)
        const suggestions = getConnectionSuggestions({
          pattern: architecturePattern,
          level: currentBoardLevel,
          sourceNodeType: sourceNode?.type ?? 'system',
          sourcePatternRole: sourceNode?.patternRole
        })
        if (suggestions.length === 0) {
          return null
        }
        return (
          <ConnectionSuggestionPopup
            position={{ x: connectionSuggestionState.screenX, y: connectionSuggestionState.screenY }}
            suggestions={suggestions}
            onSelect={(suggestion: ConnectionSuggestion) => {
              const nextCreation: PendingNodeCreation = {
                request: {
                  type: suggestion.nodeType,
                  patternRole: suggestion.patternRole,
                  defaultAppearance: suggestion.defaultAppearance
                },
                x: connectionSuggestionState.canvasX,
                y: connectionSuggestionState.canvasY,
                relationSourceNodeId: connectionSuggestionState.sourceNodeId,
                relationType: suggestion.suggestedRelationType
              }

              if (shouldSkipNodeMeaningCapture(suggestion.nodeType)) {
                const newNode = createNode({
                  ...nextCreation.request,
                  title: resolveDefaultNodeTitle(suggestion.nodeType, suggestion.patternRole),
                  x: nextCreation.x,
                  y: nextCreation.y
                })

                if (!newNode) return

                createRelation(
                  nextCreation.relationSourceNodeId as string,
                  newNode.id,
                  nextCreation.relationType
                )
                handleNodeSelect(newNode.id)
                setConnectionSuggestionState(null)
                return
              }

              setPendingNodeCreation(nextCreation)
            }}
            onClose={() => setConnectionSuggestionState(null)}
          />
        )
      })() : null}

      {pendingRelation ? (
        <div className="dialog-backdrop" onClick={() => setPendingRelation(null)}>
          <div className="dialog-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-card__header">
              <h2>Create Relation</h2>
            </div>
            <RelationPanel
              level={currentBoardLevel}
              nodes={nodes}
              preselectedSourceId={pendingRelation.sourceNodeId}
              preselectedTargetId={pendingRelation.targetNodeId}
              architecturePattern={architecturePattern}
              onCreateRelation={(sourceNodeId, targetNodeId, type) => {
                const sameDirection =
                  sourceNodeId === pendingRelation.sourceNodeId &&
                  targetNodeId === pendingRelation.targetNodeId
                const reversedDirection =
                  sourceNodeId === pendingRelation.targetNodeId &&
                  targetNodeId === pendingRelation.sourceNodeId

                const sourceHandleId = sameDirection
                  ? pendingRelation.sourceHandleId
                  : reversedDirection
                    ? pendingRelation.targetHandleId
                    : undefined
                const targetHandleId = sameDirection
                  ? pendingRelation.targetHandleId
                  : reversedDirection
                    ? pendingRelation.sourceHandleId
                    : undefined

                createRelation(
                  sourceNodeId,
                  targetNodeId,
                  type,
                  undefined,
                  sourceHandleId,
                  targetHandleId
                )
                setPendingRelation(null)
              }}
            />
            <div className="dialog-card__actions">
              <button
                type="button"
                onClick={() => setPendingRelation(null)}
                data-ui-log="Relation dialog – Cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
