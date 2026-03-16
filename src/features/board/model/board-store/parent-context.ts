import type { Board } from '@/domain/models/board'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import type { ParentContext, ParentReference } from '@/features/board/model/board-store/types'

function toParentReference(board: Board, node: SemanticNode): ParentReference | undefined {
  if (board.level !== 'N1' && board.level !== 'N2') return undefined

  return {
    level: board.level,
    boardId: board.id,
    boardName: board.name,
    nodeId: node.id,
    nodeTitle: node.title
  }
}

export async function resolveParentContext(board: Board): Promise<ParentContext | undefined> {
  if (!board.parentBoardId || !board.parentNodeId) return undefined

  const [immediateBoard, immediateNodes] = await Promise.all([
    boardRepo.getById(board.parentBoardId),
    semanticNodeRepo.listByBoard(board.parentBoardId)
  ])
  const immediateNode = immediateNodes.find((node) => node.id === board.parentNodeId)
  if (!immediateBoard || !immediateNode) return undefined

  const immediate = toParentReference(immediateBoard, immediateNode)
  if (!immediate) return undefined

  if (!immediateBoard.parentBoardId || !immediateBoard.parentNodeId) {
    return { immediate }
  }

  const [ancestorBoard, ancestorNodes] = await Promise.all([
    boardRepo.getById(immediateBoard.parentBoardId),
    semanticNodeRepo.listByBoard(immediateBoard.parentBoardId)
  ])
  const ancestorNode = ancestorNodes.find((node) => node.id === immediateBoard.parentNodeId)
  if (!ancestorBoard || !ancestorNode) {
    return { immediate }
  }

  const ancestor = toParentReference(ancestorBoard, ancestorNode)
  if (!ancestor) {
    return { immediate }
  }

  return { immediate, ancestor }
}
