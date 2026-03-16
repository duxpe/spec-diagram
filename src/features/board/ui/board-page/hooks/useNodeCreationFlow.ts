import { useState } from 'react'
import { resolveDefaultNodeTitle } from '@/domain/services/board-service'
import { shouldSkipNodeMeaningCapture } from '@/domain/semantics/meaning-capture'
import type { CreateNodeRequest } from '@/features/board/ui/components/hud/FloatingToolbar'
import type { BoardState } from '@/features/board/model/board-store/types'
import type { ConnectionSuggestionState, PendingNodeCreation } from '@/features/board/ui/board-page/types'

interface UseNodeCreationFlowInput {
  currentBoardId?: string
  boardId: string
  createNode: BoardState['createNode']
  createRelation: BoardState['createRelation']
  onNodeSelect: (nodeId?: string) => void
  setConnectionSuggestionState: (value: ConnectionSuggestionState | null) => void
}

export function useNodeCreationFlow({
  currentBoardId,
  boardId,
  createNode,
  createRelation,
  onNodeSelect,
  setConnectionSuggestionState
}: UseNodeCreationFlowInput) {
  const [pendingNodeCreation, setPendingNodeCreation] = useState<PendingNodeCreation | null>(null)

  const handleCreateNode = (request: CreateNodeRequest): void => {
    if (!currentBoardId || currentBoardId !== boardId) return
    const type = request.type ?? 'system'

    if (shouldSkipNodeMeaningCapture(type)) {
      const newNode = createNode({
        ...request,
        title: resolveDefaultNodeTitle(type, request.patternRole)
      })

      if (!newNode) return
      onNodeSelect(newNode.id)
      return
    }

    setPendingNodeCreation({ request })
  }

  const completeNodeCreation = (payload: {
    title: string
    description?: string
    meaning: Parameters<BoardState['createNode']>[0]['meaning']
    meaningDraft: NonNullable<Parameters<BoardState['createNode']>[0]['meaningDraft']>
  }): void => {
    if (!pendingNodeCreation) return

    const newNode = createNode({
      ...pendingNodeCreation.request,
      title: payload.title,
      description: payload.description,
      meaning: payload.meaning,
      meaningDraft: payload.meaningDraft,
      x: pendingNodeCreation.x,
      y: pendingNodeCreation.y
    })

    if (!newNode) return

    if (pendingNodeCreation.relationSourceNodeId && pendingNodeCreation.relationType) {
      createRelation(
        pendingNodeCreation.relationSourceNodeId,
        newNode.id,
        pendingNodeCreation.relationType
      )
    }

    onNodeSelect(newNode.id)
    setPendingNodeCreation(null)
    setConnectionSuggestionState(null)
  }

  return {
    pendingNodeCreation,
    setPendingNodeCreation,
    handleCreateNode,
    completeNodeCreation
  }
}
