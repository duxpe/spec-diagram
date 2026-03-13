import Dexie, { Table } from 'dexie'
import { Board } from '@/domain/models/board'
import { ExportHistoryEntry } from '@/domain/models/export'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Workspace } from '@/domain/models/workspace'

export class DesignerDatabase extends Dexie {
  workspaces!: Table<Workspace, string>
  boards!: Table<Board, string>
  nodes!: Table<SemanticNode, string>
  relations!: Table<Relation, string>
  exports!: Table<ExportHistoryEntry, string>

  constructor() {
    super('designer-database')

    this.version(1).stores({
      workspaces: '&id, updatedAt',
      boards: '&id, workspaceId, parentBoardId, level, updatedAt',
      nodes: '&id, workspaceId, boardId, level, type, updatedAt',
      relations: '&id, workspaceId, boardId, updatedAt',
      exports: '&id, workspaceId, createdAt'
    })

    // v2: adds architecturePattern to workspaces, patternRole to nodes,
    // and expanded relation types. No index changes needed.
    this.version(2).stores({
      workspaces: '&id, updatedAt',
      boards: '&id, workspaceId, parentBoardId, level, updatedAt',
      nodes: '&id, workspaceId, boardId, level, type, updatedAt',
      relations: '&id, workspaceId, boardId, updatedAt',
      exports: '&id, workspaceId, createdAt'
    })

    // v3: adds workspace brief and node meaning metadata. No index changes needed.
    this.version(3).stores({
      workspaces: '&id, updatedAt',
      boards: '&id, workspaceId, parentBoardId, level, updatedAt',
      nodes: '&id, workspaceId, boardId, level, type, updatedAt',
      relations: '&id, workspaceId, boardId, updatedAt',
      exports: '&id, workspaceId, createdAt'
    })
  }
}

export const db = new DesignerDatabase()
