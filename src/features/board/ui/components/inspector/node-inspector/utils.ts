import type { SemanticNode } from '@/domain/models/semantic-node'

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function parseListText(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function getBehaviorPrompts(
  nodeType: SemanticNode['type'],
  draftData: Record<string, unknown>
): string[] {
  const prompts = (() => {
    switch (nodeType) {
      case 'api_contract':
        return ['constraints', 'errorCases']
      case 'class':
        return ['invariants']
      default:
        return []
    }
  })()

  return prompts.filter((key) => {
    const value = draftData[key]
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'string') return value.trim().length === 0
    return value === undefined
  })
}
