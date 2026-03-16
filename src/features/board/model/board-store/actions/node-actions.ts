import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { applyMeaningToNodeData } from '@/domain/semantics/meaning-capture'
import {
  getDefaultNodeData,
  isNodeTypeAllowedForLevel
} from '@/domain/semantics/semantic-catalog'
import { BoardService } from '@/domain/services/board-service'
import { ValidationService } from '@/domain/services/validation-service'
import { formatValidationError } from '@/features/board/model/board-store/error-format'
import { updateBoardTimestamps } from '@/features/board/model/board-store/state-utils'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'
import { nowIso } from '@/shared/lib/dates'
import { logUiEvent } from '@/shared/lib/ui-logger'

export function createCreateNodeAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['createNode'] {
  return (input) => {
    const currentBoard = get().currentBoard

    if (!currentBoard) return

    const requestedType = input.type ?? 'system'
    if (!isNodeTypeAllowedForLevel(currentBoard.level, requestedType)) {
      set({ error: `Node type "${requestedType}" is not allowed in ${currentBoard.level}` })
      return
    }

    try {
      const baseData = getDefaultNodeData(currentBoard.level, requestedType)

      const nextData =
        input.meaning && input.meaningDraft
          ? applyMeaningToNodeData(requestedType, baseData, input.meaning, input.meaningDraft)
          : baseData

      const node = BoardService.createNode({
        projectId: currentBoard.projectId,
        boardId: currentBoard.id,
        level: currentBoard.level,
        type: input.type,
        title: input.title,
        description: input.description,
        meaning: input.meaning,
        data: nextData,
        x: input.x,
        y: input.y,
        patternRole: input.patternRole,
        defaultAppearance: input.defaultAppearance
      })

      ValidationService.parse(semanticNodeSchema, node)

      logUiEvent('Node created', {
        nodeId: node.id,
        title: node.title,
        type: node.type,
        level: node.level,
        boardId: node.boardId
      })

      set((state) => ({
        nodes: [...state.nodes, node],
        currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
        dirty: true,
        error: undefined
      }))

      return node
    } catch (error) {
      set({ error: formatValidationError(error) })
    }
  }
}

export function createUpdateNodeAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['updateNode'] {
  return (id, patch) => {
    const currentNode = get().nodes.find((node) => node.id === id)
    if (!currentNode) return

    const patchEntries = Object.entries(patch) as Array<[keyof typeof currentNode, unknown]>
    const isChanged = patchEntries.some(([key, value]) => currentNode[key] !== value)
    if (!isChanged) return

    const nextNode = {
      ...currentNode,
      ...patch,
      updatedAt: nowIso()
    }

    try {
      ValidationService.parse(semanticNodeSchema, nextNode)
    } catch (error) {
      set({ error: formatValidationError(error) })
      return
    }

    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? nextNode : node)),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true,
      error: undefined
    }))
  }
}

export function createMoveNodeAction(get: BoardStoreGet): BoardState['moveNode'] {
  return (id, x, y) => {
    get().updateNode(id, { x, y })
  }
}

export function createDeleteNodeAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['deleteNode'] {
  return (nodeId) => {
    const nodeToDelete = get().nodes.find((node) => node.id === nodeId)
    if (nodeToDelete) {
      logUiEvent('Node deleted', {
        nodeId,
        title: nodeToDelete.title,
        type: nodeToDelete.type,
        boardId: nodeToDelete.boardId
      })
    }

    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== nodeId)
      const relations = state.relations.filter(
        (relation) => relation.sourceNodeId !== nodeId && relation.targetNodeId !== nodeId
      )

      return {
        nodes,
        relations,
        currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
        dirty: true
      }
    })

    void get().saveCurrentBoard()
  }
}
