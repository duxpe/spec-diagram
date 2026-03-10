import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Workspace } from '@/domain/models/workspace'

export interface WorkspaceExportFile {
  version: '1.0.0'
  exportedAt: string
  workspace: Workspace
  boards: Board[]
  nodes: SemanticNode[]
  relations: Relation[]
}

export interface ExportHistoryEntry {
  id: string
  workspaceId: string
  boardId?: string
  kind: 'json_snapshot'
  payload: string
  createdAt: string
}
