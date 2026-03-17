import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { boardSchema } from '@/domain/schemas/board.schema'
import { projectSchema } from '@/domain/schemas/project.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { applyMeaningToNodeData } from '@/domain/semantics/meaning-capture'
import {
  getDefaultNodeData,
  isNodeTypeAllowedForLevel
} from '@/domain/semantics/semantic-catalog'
import type { Board } from '@/domain/models/board'
import type { Project } from '@/domain/models/project'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { BoardService } from '@/domain/services/board-service'
import { ValidationService } from '@/domain/services/validation-service'
import { formatValidationError } from '@/features/board/model/board-store/error-format'
import { updateBoardTimestamps } from '@/features/board/model/board-store/state-utils'
import type { BoardState, BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'
import { db } from '@/infrastructure/db/dexie'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import { relationRepo } from '@/infrastructure/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import { nowIso } from '@/shared/lib/dates'
import { createId } from '@/shared/lib/ids'
import { logUiEvent } from '@/shared/lib/ui-logger'

const DUPLICATE_OFFSET = 40

function deepCopy<T>(value: T): T {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeDefinedDeep(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return deepCopy(base)
  }

  if (Array.isArray(override)) {
    return deepCopy(override)
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = {}
    const allKeys = new Set([...Object.keys(base), ...Object.keys(override)])
    for (const key of allKeys) {
      result[key] = mergeDefinedDeep(base[key], override[key])
    }
    return result
  }

  return deepCopy(override)
}

function buildHardenedNodeData(node: Pick<SemanticNode, 'level' | 'type' | 'data'>): Record<string, unknown> {
  const defaults = getDefaultNodeData(node.level, node.type)
  return mergeDefinedDeep(defaults, node.data) as Record<string, unknown>
}

function buildDuplicateTitle(sourceTitle: string, existingNodes: SemanticNode[]): string {
  const existingTitles = new Set(existingNodes.map((node) => node.title))
  const firstCopyTitle = `${sourceTitle} (copy)`
  if (!existingTitles.has(firstCopyTitle)) return firstCopyTitle

  let index = 2
  while (existingTitles.has(`${sourceTitle} (copy ${index})`)) {
    index += 1
  }

  return `${sourceTitle} (copy ${index})`
}

function createDuplicatedNodeFromSource(
  sourceNode: SemanticNode,
  board: Board,
  existingNodes: SemanticNode[]
): SemanticNode {
  const now = nowIso()
  return {
    ...sourceNode,
    id: createId('node'),
    projectId: board.projectId,
    boardId: board.id,
    title: buildDuplicateTitle(sourceNode.title, existingNodes),
    x: sourceNode.x + DUPLICATE_OFFSET,
    y: sourceNode.y + DUPLICATE_OFFSET,
    childBoardId: undefined,
    meaning: deepCopy(sourceNode.meaning),
    data: buildHardenedNodeData(sourceNode),
    appearance: deepCopy(sourceNode.appearance),
    createdAt: now,
    updatedAt: now
  }
}

function validateDuplicatedNode(duplicatedNode: SemanticNode): SemanticNode {
  try {
    return ValidationService.parse(semanticNodeSchema, duplicatedNode)
  } catch {
    const fallbackNode = {
      ...duplicatedNode,
      data: getDefaultNodeData(duplicatedNode.level, duplicatedNode.type)
    }
    return ValidationService.parse(semanticNodeSchema, fallbackNode)
  }
}

function createDuplicatedRelations(
  sourceNodeId: string,
  duplicatedNodeId: string,
  relations: Relation[],
  board: Board
): Relation[] {
  const now = nowIso()
  return relations
    .filter((relation) => relation.sourceNodeId === sourceNodeId || relation.targetNodeId === sourceNodeId)
    .map((relation) =>
      ValidationService.parse(relationSchema, {
        ...relation,
        id: createId('rel'),
        projectId: board.projectId,
        boardId: board.id,
        sourceNodeId: relation.sourceNodeId === sourceNodeId ? duplicatedNodeId : relation.sourceNodeId,
        targetNodeId: relation.targetNodeId === sourceNodeId ? duplicatedNodeId : relation.targetNodeId,
        createdAt: now,
        updatedAt: now
      })
    )
}

async function cloneChildBoardForDuplicate(params: {
  currentBoard: Board
  sourceNode: SemanticNode
  duplicatedNode: SemanticNode
}): Promise<{ childBoardId?: string }> {
  const { currentBoard, sourceNode } = params
  if (!sourceNode.childBoardId) {
    return {}
  }

  const sourceChildBoard = await boardRepo.getById(sourceNode.childBoardId)
  if (!sourceChildBoard || sourceChildBoard.projectId !== currentBoard.projectId) {
    return {}
  }

  const [sourceChildNodes, sourceChildRelations, project] = await Promise.all([
    semanticNodeRepo.listByBoard(sourceChildBoard.id),
    relationRepo.listByBoard(sourceChildBoard.id),
    projectRepo.getById(currentBoard.projectId)
  ])

  if (!project) {
    throw new Error('Project not found while duplicating child board')
  }

  const now = nowIso()
  const clonedChildBoardId = createId('board')
  const clonedChildBoard: Board = ValidationService.parse(boardSchema, {
    ...sourceChildBoard,
    id: clonedChildBoardId,
    projectId: currentBoard.projectId,
    parentBoardId: currentBoard.id,
    parentNodeId: params.duplicatedNode.id,
    name: `${params.duplicatedNode.title} detail`,
    nodeIds: [],
    relationIds: [],
    createdAt: now,
    updatedAt: now
  })

  const childNodeIdMap = new Map<string, string>()
  sourceChildNodes.forEach((node) => {
    childNodeIdMap.set(node.id, createId('node'))
  })

  const clonedChildNodes: SemanticNode[] = sourceChildNodes.map((node) => {
    const duplicatedChildNode: SemanticNode = {
      ...node,
      id: childNodeIdMap.get(node.id) ?? createId('node'),
      projectId: currentBoard.projectId,
      boardId: clonedChildBoardId,
      parentNodeId: undefined,
      childBoardId: undefined,
      meaning: deepCopy(node.meaning),
      data: buildHardenedNodeData(node),
      appearance: deepCopy(node.appearance),
      createdAt: now,
      updatedAt: now
    }

    return validateDuplicatedNode(duplicatedChildNode)
  })

  const clonedChildRelations: Relation[] = sourceChildRelations
    .map((relation) => {
      const nextSourceNodeId = childNodeIdMap.get(relation.sourceNodeId)
      const nextTargetNodeId = childNodeIdMap.get(relation.targetNodeId)
      if (!nextSourceNodeId || !nextTargetNodeId) return undefined

      return ValidationService.parse(relationSchema, {
        ...relation,
        id: createId('rel'),
        projectId: currentBoard.projectId,
        boardId: clonedChildBoardId,
        sourceNodeId: nextSourceNodeId,
        targetNodeId: nextTargetNodeId,
        createdAt: now,
        updatedAt: now
      })
    })
    .filter((relation): relation is Relation => !!relation)

  const nextBoard: Board = ValidationService.parse(boardSchema, {
    ...clonedChildBoard,
    nodeIds: clonedChildNodes.map((node) => node.id),
    relationIds: clonedChildRelations.map((relation) => relation.id),
    updatedAt: nowIso()
  })

  const nextProject: Project = ValidationService.parse(projectSchema, {
    ...project,
    boardIds: project.boardIds.includes(nextBoard.id) ? project.boardIds : [...project.boardIds, nextBoard.id],
    updatedAt: nowIso()
  })

  await db.transaction('rw', db.projects, db.boards, db.nodes, db.relations, async () => {
    await db.boards.put(nextBoard)
    await db.nodes.bulkPut(clonedChildNodes)
    await db.relations.bulkPut(clonedChildRelations)
    await db.projects.put(nextProject)
  })

  return { childBoardId: nextBoard.id }
}

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

export function createDuplicateNodeAction(
  set: BoardStoreSet,
  get: BoardStoreGet
): BoardState['duplicateNode'] {
  return async (nodeId) => {
    const currentBoard = get().currentBoard
    if (!currentBoard) return undefined

    const sourceNode = get().nodes.find((node) => node.id === nodeId)
    if (!sourceNode) {
      set({ error: 'Node not found' })
      return undefined
    }

    try {
      let duplicatedNode = validateDuplicatedNode(
        createDuplicatedNodeFromSource(sourceNode, currentBoard, get().nodes)
      )
      const duplicatedRelations = createDuplicatedRelations(
        sourceNode.id,
        duplicatedNode.id,
        get().relations,
        currentBoard
      )

      const clonedChild = await cloneChildBoardForDuplicate({
        currentBoard,
        sourceNode,
        duplicatedNode
      })
      if (clonedChild.childBoardId) {
        duplicatedNode = ValidationService.parse(semanticNodeSchema, {
          ...duplicatedNode,
          childBoardId: clonedChild.childBoardId,
          updatedAt: nowIso()
        })
      }

      logUiEvent('Node duplicated', {
        sourceNodeId: sourceNode.id,
        duplicatedNodeId: duplicatedNode.id,
        boardId: currentBoard.id
      })

      set((state) => ({
        nodes: [...state.nodes, duplicatedNode],
        relations: [...state.relations, ...duplicatedRelations],
        currentBoard: state.currentBoard ? updateBoardTimestamps(state.currentBoard) : state.currentBoard,
        dirty: true,
        error: undefined
      }))

      return duplicatedNode
    } catch (error) {
      set({ error: formatValidationError(error) })
      return undefined
    }
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
