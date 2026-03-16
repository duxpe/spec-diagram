import { Board, SemanticLevel } from '@/domain/models/board'
import type { NodeAppearance } from '@/domain/models/node-appearance'
import { Relation, RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeMeaning, SemanticNodeType } from '@/domain/models/semantic-node'
import {
  getDefaultNodeData,
  isNodeTypeAllowedForLevel,
  isRelationTypeAllowedForLevel
} from '@/domain/semantics/semantic-catalog'
import { NavigationService } from '@/domain/services/navigation-service'
import { createId } from '@/shared/lib/ids'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'
import { nowIso } from '@/shared/lib/dates'

function titleize(text: string): string {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function resolveDefaultNodeTitle(type: SemanticNodeType, patternRole?: string): string {
  if (patternRole) {
    for (const definition of Object.values(PATTERN_CATALOG)) {
      const entry = definition.n1Nodes.find((node) => node.patternRole === patternRole)
      if (entry) return entry.label
    }
  }

  return titleize(type)
}

export class BoardService {
  static createRootBoard(projectId: string): Board {
    const now = nowIso()

    return {
      id: createId('board'),
      projectId,
      level: 'N1',
      name: 'Root Board',
      nodeIds: [],
      relationIds: [],
      createdAt: now,
      updatedAt: now
    }
  }

  static createChildBoard(input: {
    projectId: string
    parentBoardId: string
    parentNodeId: string
    parentLevel: SemanticLevel
    name?: string
  }): Board {
    const childLevel = NavigationService.inferChildLevel(input.parentLevel)

    if (!childLevel) {
      throw new Error(`${input.parentLevel} nodes cannot open deeper boards in MVP`)
    }

    const now = nowIso()

    return {
      id: createId('board'),
      projectId: input.projectId,
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
    projectId: string
    boardId: string
    level: SemanticLevel
    type?: SemanticNodeType
    title?: string
    description?: string
    meaning?: SemanticNodeMeaning
    data?: Record<string, unknown>
    x?: number
    y?: number
    patternRole?: string
    defaultAppearance?: Partial<NodeAppearance>
  }): SemanticNode {
    const now = nowIso()
    const type = input.type ?? 'system'

    if (!isNodeTypeAllowedForLevel(input.level, type)) {
      throw new Error(`Node type "${type}" is not allowed in ${input.level}`)
    }
    const title = input.title ?? resolveDefaultNodeTitle(type, input.patternRole)

    return {
      id: createId('node'),
      projectId: input.projectId,
      boardId: input.boardId,
      level: input.level,
      type,
      patternRole: input.patternRole,
      title,
      description: input.description,
      meaning: input.meaning,
      x: input.x ?? 120,
      y: input.y ?? 80,
      width: 220,
      height: 110,
      data: input.data ?? getDefaultNodeData(input.level, type),
      appearance: input.defaultAppearance ? { ...input.defaultAppearance } : undefined,
      createdAt: now,
      updatedAt: now
    }
  }

  static createRelation(input: {
    projectId: string
    boardId: string
    level: SemanticLevel
    sourceNodeId: string
    targetNodeId: string
    sourceHandleId?: string
    targetHandleId?: string
    type?: RelationType
    label?: string
    bypassLevelRelationTypeCheck?: boolean
    sourceBoardId: string
    targetBoardId: string
  }): Relation {
    if (input.sourceNodeId === input.targetNodeId) {
      throw new Error('Relation requires distinct source and target nodes')
    }

    const type = input.type ?? 'depends_on'

    if (!input.bypassLevelRelationTypeCheck && !isRelationTypeAllowedForLevel(input.level, type)) {
      throw new Error(`Relation type "${type}" is not allowed in ${input.level}`)
    }

    if (input.sourceBoardId !== input.targetBoardId || input.sourceBoardId !== input.boardId) {
      throw new Error('Relations are only valid between nodes in the same board')
    }

    const now = nowIso()

    return {
      id: createId('rel'),
      projectId: input.projectId,
      boardId: input.boardId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      sourceHandleId: input.sourceHandleId,
      targetHandleId: input.targetHandleId,
      type,
      label: input.label,
      createdAt: now,
      updatedAt: now
    }
  }
}
