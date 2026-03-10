import { Board, SemanticLevel } from '@/domain/models/board'
import { Relation, RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { NavigationService } from '@/domain/services/navigation-service'
import { createId } from '@/utils/ids'
import { nowIso } from '@/utils/dates'

export class BoardService {
  static createRootBoard(workspaceId: string): Board {
    const now = nowIso()

    return {
      id: createId('board'),
      workspaceId,
      level: 'N1',
      name: 'Root Board',
      nodeIds: [],
      relationIds: [],
      createdAt: now,
      updatedAt: now
    }
  }

  static createChildBoard(input: {
    workspaceId: string
    parentBoardId: string
    parentNodeId: string
    parentLevel: SemanticLevel
    name?: string
  }): Board {
    const childLevel = NavigationService.inferChildLevel(input.parentLevel)

    if (!childLevel) {
      throw new Error('N3 nodes cannot open deeper boards in MVP')
    }

    const now = nowIso()

    return {
      id: createId('board'),
      workspaceId: input.workspaceId,
      parentBoardId: input.parentBoardId,
      parentNodeId: input.parentNodeId,
      level: childLevel,
      name: input.name ?? `Detail ${childLevel}`,
      nodeIds: [],
      relationIds: [],
      createdAt: now,
      updatedAt: now
    }
  }

  static createNode(input: {
    workspaceId: string
    boardId: string
    level: SemanticLevel
    type?: SemanticNodeType
    title?: string
    x?: number
    y?: number
  }): SemanticNode {
    const now = nowIso()

    return {
      id: createId('node'),
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      level: input.level,
      type: input.type ?? 'system',
      title: input.title ?? 'New Node',
      x: input.x ?? 120,
      y: input.y ?? 80,
      width: 220,
      height: 110,
      data: {},
      createdAt: now,
      updatedAt: now
    }
  }

  static createRelation(input: {
    workspaceId: string
    boardId: string
    sourceNodeId: string
    targetNodeId: string
    type?: RelationType
    label?: string
    sourceBoardId: string
    targetBoardId: string
  }): Relation {
    if (input.sourceNodeId === input.targetNodeId) {
      throw new Error('Relation requires distinct source and target nodes')
    }

    if (input.sourceBoardId !== input.targetBoardId || input.sourceBoardId !== input.boardId) {
      throw new Error('Relations are only valid between nodes in the same board')
    }

    const now = nowIso()

    return {
      id: createId('rel'),
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      type: input.type ?? 'depends_on',
      label: input.label,
      createdAt: now,
      updatedAt: now
    }
  }
}
