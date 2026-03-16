import type { StoreApi } from 'zustand'
import type { Board } from '@/domain/models/board'
import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { Relation, RelationType } from '@/domain/models/relation'
import type { SemanticNode, SemanticNodeMeaning, SemanticNodeType } from '@/domain/models/semantic-node'
import type { NodeMeaningDraft } from '@/domain/semantics/meaning-capture'

export interface ParentReference {
  level: 'N1' | 'N2'
  boardId: string
  boardName: string
  nodeId: string
  nodeTitle: string
}

export interface ParentContext {
  immediate: ParentReference
  ancestor?: ParentReference
}

export interface BoardState {
  loading: boolean
  saving: boolean
  dirty: boolean
  error?: string
  loadRequestKey?: string
  currentBoard?: Board
  parentContext?: ParentContext
  nodes: SemanticNode[]
  relations: Relation[]
  loadBoard: (projectId: string, boardId: string) => Promise<void>
  createNode: (input: {
    type?: SemanticNodeType
    patternRole?: string
    defaultAppearance?: Partial<NodeAppearance>
    title?: string
    description?: string
    meaning?: SemanticNodeMeaning
    meaningDraft?: NodeMeaningDraft
    x?: number
    y?: number
  }) => SemanticNode | undefined
  updateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'projectId' | 'boardId'>>) => void
  moveNode: (id: string, x: number, y: number) => void
  createRelation: (
    sourceNodeId: string,
    targetNodeId: string,
    type?: RelationType,
    label?: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  updateRelation: (id: string, patch: { type?: RelationType; label?: string }) => void
  reverseRelation: (id: string) => void
  deleteNode: (nodeId: string) => void
  deleteRelation: (relationId: string) => void
  applyCanvasState: (sourceBoardId: string, nodes: SemanticNode[], relations: Relation[]) => boolean
  saveCurrentBoard: () => Promise<boolean>
  openOrCreateChildBoard: (nodeId: string) => Promise<Board>
}

export type BoardStoreSet = StoreApi<BoardState>['setState']
export type BoardStoreGet = StoreApi<BoardState>['getState']
