import { BoardService } from '@/domain/services/board-service'
import { canOpenDetail } from '@/domain/semantics/semantic-catalog'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { db } from '@/infrastructure/db/dexie'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'
import { updateBoardTimestamps } from '@/features/board/model/board-store/state-utils'
import { nowIso } from '@/shared/lib/dates'

export function createOpenOrCreateChildBoardAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['openOrCreateChildBoard'] {
  return async (nodeId) => {
    const { currentBoard, nodes } = get()

    if (!currentBoard) {
      throw new Error('No board loaded')
    }

    const node = nodes.find((item) => item.id === nodeId)

    if (!node) {
      throw new Error('Node not found')
    }

    if (!canOpenDetail(node)) {
      throw new Error(`Node type "${node.type}" cannot open detail board from level ${node.level}`)
    }

    if (node.childBoardId) {
      const existingChildBoard = await boardRepo.getById(node.childBoardId)
      if (existingChildBoard) {
        return existingChildBoard
      }
    }

    const childBoard = BoardService.createChildBoard({
      projectId: currentBoard.projectId,
      parentBoardId: currentBoard.id,
      parentNodeId: node.id,
      parentLevel: node.level,
      name: `${node.title} detail`
    })

    const updatedNode: SemanticNode = {
      ...node,
      childBoardId: childBoard.id,
      updatedAt: nowIso()
    }

    const updatedProject = await projectRepo.getById(currentBoard.projectId)
    if (!updatedProject) {
      throw new Error('Project not found while creating child board')
    }

    const nextProjectBoardIds = updatedProject.boardIds.includes(childBoard.id)
      ? updatedProject.boardIds
      : [...updatedProject.boardIds, childBoard.id]

    await db.transaction('rw', db.projects, db.boards, db.nodes, async () => {
      await db.boards.put(childBoard)
      await db.nodes.put(updatedNode)
      await db.projects.put({
        ...updatedProject,
        boardIds: nextProjectBoardIds,
        updatedAt: nowIso()
      })
    })

    set((state) => ({
      nodes: state.nodes.map((item) => (item.id === updatedNode.id ? updatedNode : item)),
      currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
      dirty: true
    }))

    return childBoard
  }
}
