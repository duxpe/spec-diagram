import type { Board } from '@/domain/models/board'
import { boardSchema } from '@/domain/schemas/board.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { ValidationService } from '@/domain/services/validation-service'
import { useAppStore } from '@/features/project/model/app-store'
import { db } from '@/infrastructure/db/dexie'
import { readBoardSnapshot } from '@/infrastructure/db/recovery'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { relationRepo } from '@/infrastructure/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import { nowIso } from '@/shared/lib/dates'
import { resolveParentContext } from '@/features/board/model/board-store/parent-context'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'

function toTimestamp(iso: string | undefined): number {
  if (!iso) return 0
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? parsed : 0
}

function isRecoveryNewer(recoveryIso: string, currentIso: string | undefined): boolean {
  return toTimestamp(recoveryIso) > toTimestamp(currentIso)
}

async function resolveParentContextSafe(board: Board) {
  try {
    return await resolveParentContext(board)
  } catch {
    return undefined
  }
}

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
      const [dexieBoard, dexieNodes, dexieRelations] = await Promise.all([
        boardRepo.getById(boardId),
        semanticNodeRepo.listByBoard(boardId),
        relationRepo.listByBoard(boardId)
      ])
      const recovery = readBoardSnapshot(projectId, boardId)

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      const hasValidDexieBoard = !!dexieBoard && dexieBoard.projectId === projectId
      const shouldUseRecovery =
        !!recovery &&
        (!hasValidDexieBoard || isRecoveryNewer(recovery.board.updatedAt, dexieBoard?.updatedAt))

      const board = shouldUseRecovery ? recovery?.board : dexieBoard
      const nodes = shouldUseRecovery ? (recovery?.nodes ?? []) : dexieNodes
      const relations = shouldUseRecovery ? (recovery?.relations ?? []) : dexieRelations

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

      const parentContext = await resolveParentContextSafe(board)

      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      set({
        loading: false,
        currentBoard: board,
        parentContext,
        nodes,
        relations,
        dirty: shouldUseRecovery,
        error: undefined,
        loadRequestKey: undefined
      })

      useAppStore.getState().setLastContext(projectId, boardId)

      if (shouldUseRecovery) {
        void get().saveCurrentBoard()
      }
    } catch (error) {
      if (get().loadRequestKey !== loadRequestKey) {
        return
      }

      const recovery = readBoardSnapshot(projectId, boardId)
      if (recovery) {
        const parentContext = await resolveParentContextSafe(recovery.board)

        if (get().loadRequestKey !== loadRequestKey) {
          return
        }

        set({
          loading: false,
          currentBoard: recovery.board,
          parentContext,
          nodes: recovery.nodes,
          relations: recovery.relations,
          dirty: true,
          error: undefined,
          loadRequestKey: undefined
        })
        useAppStore.getState().setLastContext(projectId, boardId)
        void get().saveCurrentBoard()
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
