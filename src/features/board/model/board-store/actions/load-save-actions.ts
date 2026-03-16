import type { Board } from '@/domain/models/board'
import { boardSchema } from '@/domain/schemas/board.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { ValidationService } from '@/domain/services/validation-service'
import { useAppStore } from '@/features/project/model/app-store'
import { db } from '@/infrastructure/db/dexie'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { relationRepo } from '@/infrastructure/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import { nowIso } from '@/shared/lib/dates'
import { resolveParentContext } from '@/features/board/model/board-store/parent-context'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'

export function createLoadBoardAction(set: BoardStoreSet, get: BoardStoreGet): BoardState['loadBoard'] {
  return async (projectId, boardId) => {
    const loadRequestKey = `${projectId}:${boardId}:${nowIso()}`
    set({
      loading: true,
      error: undefined,
      loadRequestKey,
      currentBoard: undefined,
      parentContext: undefined,
      nodes: [],
      relations: [],
      dirty: false
    })

    try {
      const [board, nodes, relations] = await Promise.all([
        boardRepo.getById(boardId),
        semanticNodeRepo.listByBoard(boardId),
        relationRepo.listByBoard(boardId)
      ])

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      if (!board || board.projectId !== projectId) {
        set({
          loading: false,
          error: 'Board not found for project',
          loadRequestKey: undefined,
          currentBoard: undefined,
          parentContext: undefined,
          nodes: [],
          relations: [],
          dirty: false
        })
        return
      }

      const parentContext = await resolveParentContext(board)

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      set({
        loading: false,
        currentBoard: board,
        parentContext,
        nodes,
        relations,
        dirty: false,
        error: undefined,
        loadRequestKey: undefined
      })

      useAppStore.getState().setLastContext(projectId, boardId)
    } catch (error) {
      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load board',
        loadRequestKey: undefined,
        currentBoard: undefined,
        parentContext: undefined,
        nodes: [],
        relations: [],
        dirty: false
      })
    }
  }
}

export function createSaveCurrentBoardAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['saveCurrentBoard'] {
  return async () => {
    const { currentBoard, nodes, relations } = get()

    if (!currentBoard || !get().dirty) return true

    set({ saving: true, error: undefined })

    try {
      const updatedBoard: Board = {
        ...currentBoard,
        nodeIds: nodes.map((node) => node.id),
        relationIds: relations.map((relation) => relation.id),
        updatedAt: nowIso()
      }

      ValidationService.parse(boardSchema, updatedBoard)
      ValidationService.parseArray(semanticNodeSchema, nodes)
      ValidationService.parseArray(relationSchema, relations)

      await db.transaction('rw', db.boards, db.nodes, db.relations, async () => {
        await db.boards.put(updatedBoard)
        await db.nodes.where('boardId').equals(updatedBoard.id).delete()
        await db.nodes.bulkPut(nodes)
        await db.relations.where('boardId').equals(updatedBoard.id).delete()
        await db.relations.bulkPut(relations)
      })

      set({ currentBoard: updatedBoard, dirty: false, saving: false })
      return true
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to persist board'
      })
      return false
    }
  }
}
