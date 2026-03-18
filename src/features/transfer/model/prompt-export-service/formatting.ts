import type { Board } from '@/domain/models/board'
import type { Project } from '@/domain/models/project'
import type { RelationDescriptor } from '@/features/transfer/model/prompt-export-service/types'
import type { SemanticNode } from '@/domain/models/semantic-node'

export const MISSING_TEXT = 'Nao informado'

export function textValue(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return MISSING_TEXT
}

export function listValue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
}

export function compareNodes(a: SemanticNode, b: SemanticNode): number {
  return (
    compareText(a.type, b.type) ||
    compareText(a.title, b.title) ||
    compareText(a.createdAt, b.createdAt) ||
    compareText(a.id, b.id)
  )
}

export function compareRelations(a: RelationDescriptor, b: RelationDescriptor): number {
  return (
    compareText(a.type, b.type) ||
    compareText(a.sourceTitle, b.sourceTitle) ||
    compareText(a.targetTitle, b.targetTitle) ||
    compareText(a.createdAt, b.createdAt) ||
    compareText(a.id, b.id)
  )
}

export function compareBoards(a: Board, b: Board): number {
  return compareText(a.createdAt, b.createdAt) || compareText(a.id, b.id)
}

export function formatNodeData(data: Record<string, unknown>): string[] {
  const keys = Object.keys(data).sort((a, b) => compareText(a, b))
  if (keys.length === 0) return [`- ${MISSING_TEXT}`]

  return keys.map((key) => {
    const value = data[key]
    if (Array.isArray(value)) {
      const list = listValue(value)
      return `- ${key}: ${list.length > 0 ? list.join('; ') : MISSING_TEXT}`
    }

    if (typeof value === 'object' && value !== null) {
      return `- ${key}: ${JSON.stringify(value)}`
    }

    return `- ${key}: ${textValue(value)}`
  })
}

export function formatRelations(relations: RelationDescriptor[]): string[] {
  if (relations.length === 0) return [`- ${MISSING_TEXT}`]

  return relations.map((relation) => {
    const label = relation.label ? ` [${relation.label}]` : ''
    return `- ${relation.sourceTitle} --${relation.type}${label}--> ${relation.targetTitle}`
  })
}

export function formatNodes(nodes: Array<{ type: string; title: string }>): string[] {
  if (nodes.length === 0) return [`- ${MISSING_TEXT}`]

  return nodes.map((node) => `- ${node.type}: ${textValue(node.title)}`)
}

export function firstDefinedText(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (Array.isArray(value)) {
      const list = listValue(value)
      if (list.length > 0) return list.join('; ')
    }
  }

  return MISSING_TEXT
}

export function firstMeaningText(
  node: SemanticNode,
  keys: Array<keyof NonNullable<SemanticNode['meaning']>>,
  fallbackKeys: string[] = []
): string {
  for (const key of keys) {
    const value = node.meaning?.[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (Array.isArray(value) && value.length > 0) return value.join('; ')
  }

  return firstDefinedText(node.data, fallbackKeys)
}

export function projectBriefValue(
  project: Project,
  key: keyof NonNullable<Project['brief']>,
  fallback?: string
): string {
  const value = project.brief?.[key]
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (Array.isArray(value) && value.length > 0) return value.join('; ')
  if (typeof fallback === 'string' && fallback.trim().length > 0) return fallback.trim()
  return MISSING_TEXT
}

export function toSlug(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized.length === 0) return 'node'
  return normalized.slice(0, 60)
}
