import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Project } from '@/domain/models/project'

export type ExportPromptType = 'spec_prompt' | 'task_prompt'

export interface PromptExportItem {
  rootNodeId: string
  rootNodeTitle: string
  rootNodeType: SemanticNode['type']
  filename: string
  markdown: string
}

export interface PromptExportBundle {
  projectId: string
  projectName: string
  exportType: ExportPromptType
  exportedAt: string
  items: PromptExportItem[]
}

export interface ProjectExportFile {
  version: '2.0.0'
  exportedAt: string
  project: Project
  boards: Board[]
  nodes: SemanticNode[]
  relations: Relation[]
}

export interface ExportHistoryEntry {
  id: string
  projectId: string
  boardId?: string
  kind: 'json_snapshot'
  payload: string
  createdAt: string
}
