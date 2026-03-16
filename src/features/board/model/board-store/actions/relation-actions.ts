import type { Relation } from '@/domain/models/relation'
import {
  isPatternRelationTypeAllowed,
  isRelationTypeAllowedForLevel
} from '@/domain/semantics/semantic-catalog'
import { BoardService } from '@/domain/services/board-service'
import { useProjectStore } from '@/features/project/model/project-store'
import { updateBoardTimestamps } from '@/features/board/model/board-store/state-utils'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'
import { nowIso } from '@/shared/lib/dates'

export function createCreateRelationAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['createRelation'] {
  return (sourceNodeId, targetNodeId, type, label, sourceHandleId, targetHandleId) => {
    const { currentBoard, nodes } = get()

    if (!currentBoard) return

    const sourceNode = nodes.find((node) => node.id === sourceNodeId)
    const targetNode = nodes.find((node) => node.id === targetNodeId)

    if (!sourceNode || !targetNode) {
      set({ error: 'Source or target node does not exist' })
      return
    }

    const relationType = type ?? 'depends_on'
    const projectPattern = useProjectStore.getState().currentProject?.architecturePattern
    const isAllowedByPattern =
      currentBoard.level === 'N1' &&
      !!projectPattern &&
      isPatternRelationTypeAllowed(
        projectPattern,
        relationType,
        sourceNode.patternRole,
        targetNode.patternRole
      )

    if (!isRelationTypeAllowedForLevel(currentBoard.level, relationType) && !isAllowedByPattern) {
      set({ error: `Relation type "${relationType}" is not allowed in ${currentBoard.level}` })
      return
    }

    try {
      const relation = BoardService.createRelation({
        projectId: currentBoard.projectId,
        boardId: currentBoard.id,
        level: currentBoard.level,
        sourceNodeId,
        targetNodeId,
        sourceHandleId,
        targetHandleId,
        bypassLevelRelationTypeCheck: isAllowedByPattern,
        sourceBoardId: sourceNode.boardId,
        targetBoardId: targetNode.boardId,
        type: relationType,
        label
      })

      set((state) => ({
        relations: [...state.relations, relation],
        currentBoard: state.currentBoard
          ? updateBoardTimestamps(state.currentBoard)
          : state.currentBoard,
        dirty: true,
        error: undefined
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create relation' })
    }
  }
}

export function createUpdateRelationAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['updateRelation'] {
  return (id, patch) => {
    const currentRelation = get().relations.find((r) => r.id === id)
    if (!currentRelation) return

    const nextRelation: Relation = {
      ...currentRelation,
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.label !== undefined ? { label: patch.label || undefined } : {}),
      updatedAt: nowIso()
    }

    set((state) => ({
      relations: state.relations.map((r) => (r.id === id ? nextRelation : r)),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true,
      error: undefined
    }))

    void get().saveCurrentBoard()
  }
}

export function createReverseRelationAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['reverseRelation'] {
  return (id) => {
    const currentRelation = get().relations.find((r) => r.id === id)
    if (!currentRelation) return

    const nextRelation: Relation = {
      ...currentRelation,
      sourceNodeId: currentRelation.targetNodeId,
      targetNodeId: currentRelation.sourceNodeId,
      sourceHandleId: currentRelation.targetHandleId,
      targetHandleId: currentRelation.sourceHandleId,
      updatedAt: nowIso()
    }

    set((state) => ({
      relations: state.relations.map((r) => (r.id === id ? nextRelation : r)),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true,
      error: undefined
    }))

    void get().saveCurrentBoard()
  }
}

export function createDeleteRelationAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['deleteRelation'] {
  return (relationId) => {
    set((state) => ({
      relations: state.relations.filter((relation) => relation.id !== relationId),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true
    }))

    void get().saveCurrentBoard()
  }
}
