import Dexie, { Table } from 'dexie'
import { Board } from '@/domain/models/board'
import { ExportHistoryEntry } from '@/domain/models/export'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Project } from '@/domain/models/project'

export class DesignerDatabase extends Dexie {
  projects!: Table<Project, string>
  boards!: Table<Board, string>
  nodes!: Table<SemanticNode, string>
  relations!: Table<Relation, string>
  exports!: Table<ExportHistoryEntry, string>

  constructor() {
    // Breaking reset: use a new DB name for the project-first architecture.
    super('designer-database-project-v1')

    this.version(1).stores({
      projects: '&id, updatedAt',
      boards: '&id, projectId, parentBoardId, level, updatedAt',
      nodes: '&id, projectId, boardId, level, type, updatedAt',
      relations: '&id, projectId, boardId, updatedAt',
      exports: '&id, projectId, createdAt'
    })
  }
}

export const db = new DesignerDatabase()
