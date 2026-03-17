import { z } from 'zod'
import type { Board } from '@/domain/models/board'
import type { Project } from '@/domain/models/project'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { boardSchema } from '@/domain/schemas/board.schema'
import { projectSchema } from '@/domain/schemas/project.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { db } from '@/infrastructure/db/dexie'
import { nowIso } from '@/shared/lib/dates'

const RECOVERY_NAMESPACE = 'designer-recovery-v1'
const RECOVERY_INDEX_KEY = `${RECOVERY_NAMESPACE}:index`
const RECOVERY_VERSION = 1 as const
const MAX_BOARD_SNAPSHOTS = 20
const MAX_PROJECT_SNAPSHOTS = 20

const recoveryBoardIndexEntrySchema = z
  .object({
    key: z.string().min(1),
    projectId: z.string().min(1),
    boardId: z.string().min(1),
    capturedAt: z.string().datetime()
  })
  .strict()

const recoveryProjectIndexEntrySchema = z
  .object({
    key: z.string().min(1),
    projectId: z.string().min(1),
    capturedAt: z.string().datetime()
  })
  .strict()

const recoveryIndexSchema = z
  .object({
    version: z.literal(RECOVERY_VERSION),
    boards: z.array(recoveryBoardIndexEntrySchema),
    projects: z.array(recoveryProjectIndexEntrySchema)
  })
  .strict()

const recoveryBoardRecordSchema = z
  .object({
    version: z.literal(RECOVERY_VERSION),
    kind: z.literal('board'),
    key: z.string().min(1),
    projectId: z.string().min(1),
    boardId: z.string().min(1),
    board: boardSchema,
    nodes: z.array(semanticNodeSchema),
    relations: z.array(relationSchema),
    capturedAt: z.string().datetime()
  })
  .strict()

const recoveryProjectRecordSchema = z
  .object({
    version: z.literal(RECOVERY_VERSION),
    kind: z.literal('project'),
    key: z.string().min(1),
    projectId: z.string().min(1),
    project: projectSchema,
    capturedAt: z.string().datetime()
  })
  .strict()

export type RecoveryBoardRecordV1 = z.infer<typeof recoveryBoardRecordSchema>
export type RecoveryProjectRecordV1 = z.infer<typeof recoveryProjectRecordSchema>
export type RecoveryIndexV1 = z.infer<typeof recoveryIndexSchema>

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function toBoardStorageKey(projectId: string, boardId: string): string {
  return `${RECOVERY_NAMESPACE}:board:${projectId}:${boardId}`
}

function toProjectStorageKey(projectId: string): string {
  return `${RECOVERY_NAMESPACE}:project:${projectId}`
}

function safeParseJson(input: string | null): unknown {
  if (!input) return undefined

  try {
    return JSON.parse(input)
  } catch {
    return undefined
  }
}

function toTimestamp(iso: string | undefined): number {
  if (!iso) return 0
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? parsed : 0
}

function isNewerTimestamp(candidateIso: string, currentIso: string | undefined): boolean {
  return toTimestamp(candidateIso) > toTimestamp(currentIso)
}

function readRecoveryIndex(storage: Storage): RecoveryIndexV1 {
  const parsed = safeParseJson(storage.getItem(RECOVERY_INDEX_KEY))
  const result = recoveryIndexSchema.safeParse(parsed)

  if (result.success) {
    return result.data
  }

  return {
    version: RECOVERY_VERSION,
    boards: [],
    projects: []
  }
}

function writeRecoveryIndex(storage: Storage, index: RecoveryIndexV1): void {
  storage.setItem(RECOVERY_INDEX_KEY, JSON.stringify(index))
}

function upsertBoardIndexEntry(
  index: RecoveryIndexV1,
  entry: z.infer<typeof recoveryBoardIndexEntrySchema>
): RecoveryIndexV1 {
  const withoutKey = index.boards.filter((item) => item.key !== entry.key)
  return {
    ...index,
    boards: [...withoutKey, entry]
  }
}

function upsertProjectIndexEntry(
  index: RecoveryIndexV1,
  entry: z.infer<typeof recoveryProjectIndexEntrySchema>
): RecoveryIndexV1 {
  const withoutKey = index.projects.filter((item) => item.key !== entry.key)
  return {
    ...index,
    projects: [...withoutKey, entry]
  }
}

function dedupeAndSortByRecency<T extends { key: string; capturedAt: string }>(items: T[]): T[] {
  const byKey = new Map<string, T>()
  for (const item of items) {
    const current = byKey.get(item.key)
    if (!current || isNewerTimestamp(item.capturedAt, current.capturedAt)) {
      byKey.set(item.key, item)
    }
  }

  return [...byKey.values()].sort((a, b) => toTimestamp(b.capturedAt) - toTimestamp(a.capturedAt))
}

function removeKeyFromIndex(index: RecoveryIndexV1, key: string): RecoveryIndexV1 {
  return {
    ...index,
    boards: index.boards.filter((item) => item.key !== key),
    projects: index.projects.filter((item) => item.key !== key)
  }
}

function removeStorageKey(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Ignore localStorage failures. Dexie remains the main source of truth.
  }
}

function readBoardRecordByKey(storage: Storage, key: string): RecoveryBoardRecordV1 | undefined {
  const parsed = safeParseJson(storage.getItem(key))
  const result = recoveryBoardRecordSchema.safeParse(parsed)
  if (result.success) return result.data

  removeStorageKey(storage, key)
  const index = readRecoveryIndex(storage)
  writeRecoveryIndex(storage, removeKeyFromIndex(index, key))
  return undefined
}

function readProjectRecordByKey(storage: Storage, key: string): RecoveryProjectRecordV1 | undefined {
  const parsed = safeParseJson(storage.getItem(key))
  const result = recoveryProjectRecordSchema.safeParse(parsed)
  if (result.success) return result.data

  removeStorageKey(storage, key)
  const index = readRecoveryIndex(storage)
  writeRecoveryIndex(storage, removeKeyFromIndex(index, key))
  return undefined
}

export function writeBoardSnapshot(input: {
  board: Board
  nodes: SemanticNode[]
  relations: Relation[]
}): void {
  const storage = getStorage()
  if (!storage) return

  try {
    const capturedAt = nowIso()
    const board = boardSchema.parse({
      ...input.board,
      nodeIds: input.nodes.map((node) => node.id),
      relationIds: input.relations.map((relation) => relation.id)
    })
    const nodes = input.nodes.map((node) => semanticNodeSchema.parse(node))
    const relations = input.relations.map((relation) => relationSchema.parse(relation))
    const key = toBoardStorageKey(board.projectId, board.id)

    const record: RecoveryBoardRecordV1 = {
      version: RECOVERY_VERSION,
      kind: 'board',
      key,
      projectId: board.projectId,
      boardId: board.id,
      board,
      nodes,
      relations,
      capturedAt
    }

    storage.setItem(key, JSON.stringify(record))
    const nextIndex = upsertBoardIndexEntry(readRecoveryIndex(storage), {
      key,
      projectId: board.projectId,
      boardId: board.id,
      capturedAt
    })
    writeRecoveryIndex(storage, nextIndex)
    pruneRecovery()
  } catch {
    // Ignore quota/write failures and continue with Dexie-only persistence.
  }
}

export function writeProjectSnapshot(project: Project): void {
  const storage = getStorage()
  if (!storage) return

  try {
    const capturedAt = nowIso()
    const parsedProject = projectSchema.parse(project)
    const key = toProjectStorageKey(parsedProject.id)

    const record: RecoveryProjectRecordV1 = {
      version: RECOVERY_VERSION,
      kind: 'project',
      key,
      projectId: parsedProject.id,
      project: parsedProject,
      capturedAt
    }

    storage.setItem(key, JSON.stringify(record))
    const nextIndex = upsertProjectIndexEntry(readRecoveryIndex(storage), {
      key,
      projectId: parsedProject.id,
      capturedAt
    })
    writeRecoveryIndex(storage, nextIndex)
    pruneRecovery()
  } catch {
    // Ignore quota/write failures and continue with Dexie-only persistence.
  }
}

export function readBoardSnapshot(
  projectId: string,
  boardId: string
): RecoveryBoardRecordV1 | undefined {
  const storage = getStorage()
  if (!storage) return undefined

  const key = toBoardStorageKey(projectId, boardId)
  const record = readBoardRecordByKey(storage, key)
  if (!record) return undefined
  if (record.projectId !== projectId || record.boardId !== boardId) return undefined
  if (record.board.projectId !== projectId || record.board.id !== boardId) return undefined
  return record
}

export function pruneRecovery(
  maxBoardSnapshots = MAX_BOARD_SNAPSHOTS,
  maxProjectSnapshots = MAX_PROJECT_SNAPSHOTS
): void {
  const storage = getStorage()
  if (!storage) return

  try {
    const index = readRecoveryIndex(storage)
    const sortedBoards = dedupeAndSortByRecency(index.boards)
    const sortedProjects = dedupeAndSortByRecency(index.projects)

    const boardsToKeep = sortedBoards.slice(0, Math.max(0, maxBoardSnapshots))
    const projectsToKeep = sortedProjects.slice(0, Math.max(0, maxProjectSnapshots))
    const boardKeysToKeep = new Set(boardsToKeep.map((item) => item.key))
    const projectKeysToKeep = new Set(projectsToKeep.map((item) => item.key))

    for (const board of sortedBoards) {
      if (!boardKeysToKeep.has(board.key)) {
        removeStorageKey(storage, board.key)
      }
    }

    for (const project of sortedProjects) {
      if (!projectKeysToKeep.has(project.key)) {
        removeStorageKey(storage, project.key)
      }
    }

    writeRecoveryIndex(storage, {
      version: RECOVERY_VERSION,
      boards: boardsToKeep,
      projects: projectsToKeep
    })
  } catch {
    // Ignore cleanup errors and continue with Dexie-only persistence.
  }
}

export function removeProjectRecovery(projectId: string): void {
  const storage = getStorage()
  if (!storage) return

  try {
    const index = readRecoveryIndex(storage)
    const remainingBoards = index.boards.filter((entry) => entry.projectId !== projectId)
    const remainingProjects = index.projects.filter((entry) => entry.projectId !== projectId)

    for (const entry of index.boards) {
      if (entry.projectId === projectId) {
        removeStorageKey(storage, entry.key)
      }
    }

    for (const entry of index.projects) {
      if (entry.projectId === projectId) {
        removeStorageKey(storage, entry.key)
      }
    }

    writeRecoveryIndex(storage, {
      version: RECOVERY_VERSION,
      boards: dedupeAndSortByRecency(remainingBoards),
      projects: dedupeAndSortByRecency(remainingProjects)
    })
  } catch {
    // Ignore cleanup errors and continue with Dexie-only persistence.
  }
}

export async function replayRecoveryIntoDexie(): Promise<void> {
  const storage = getStorage()
  if (!storage) return

  try {
    const index = readRecoveryIndex(storage)
    const projectEntries = dedupeAndSortByRecency(index.projects)
    const boardEntries = dedupeAndSortByRecency(index.boards)

    for (const entry of projectEntries) {
      const record = readProjectRecordByKey(storage, entry.key)
      if (!record) continue

      const currentProject = await db.projects.get(record.project.id)
      const shouldApply =
        !currentProject ||
        isNewerTimestamp(
          record.project.updatedAt,
          typeof currentProject.updatedAt === 'string' ? currentProject.updatedAt : undefined
        )

      if (shouldApply) {
        await db.projects.put(record.project)
      }
    }

    for (const entry of boardEntries) {
      const record = readBoardRecordByKey(storage, entry.key)
      if (!record) continue

      const currentBoard = await db.boards.get(record.board.id)
      const shouldApply =
        !currentBoard ||
        isNewerTimestamp(
          record.board.updatedAt,
          typeof currentBoard.updatedAt === 'string' ? currentBoard.updatedAt : undefined
        )

      if (!shouldApply) continue

      await db.transaction('rw', db.boards, db.nodes, db.relations, async () => {
        await db.boards.put(record.board)
        await db.nodes.where('boardId').equals(record.board.id).delete()
        if (record.nodes.length > 0) {
          await db.nodes.bulkPut(record.nodes)
        }
        await db.relations.where('boardId').equals(record.board.id).delete()
        if (record.relations.length > 0) {
          await db.relations.bulkPut(record.relations)
        }
      })
    }

    pruneRecovery()
  } catch {
    // Recovery replay is best-effort and must never block normal startup.
  }
}
