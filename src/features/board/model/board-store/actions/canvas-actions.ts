import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'
import { hasCanvasDiff } from '@/features/board/model/board-store/comparison'
import { updateBoardTimestamps } from '@/features/board/model/board-store/state-utils'

export function createApplyCanvasStateAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['applyCanvasState'] {
  return (sourceBoardId, nodes, relations) => {
    const currentBoardId = get().currentBoard?.id
    if (!currentBoardId || currentBoardId !== sourceBoardId) return false

    const currentNodes = get().nodes
    const currentRelations = get().relations
    const hasChanges = hasCanvasDiff(currentNodes, nodes, currentRelations, relations)
    if (!hasChanges) return false

    const hasDeletedNode = nodes.length < currentNodes.length
    const hasDeletedRelation = relations.length < currentRelations.length

    set((state) => {
      if (!state.currentBoard || state.currentBoard.id !== sourceBoardId) {
        return state
      }

      return {
        nodes,
        relations,
        currentBoard: updateBoardTimestamps(state.currentBoard),
        dirty: true
      }
    })

    if (hasDeletedNode || hasDeletedRelation) {
      void get().saveCurrentBoard()
    }

    return true
  }
}
