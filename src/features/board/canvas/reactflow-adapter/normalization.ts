import type { RelationType } from '@/domain/models/relation'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import { relationTypeSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeTypeSchema } from '@/domain/schemas/semantic-node.schema'
import { FLOAT_TOLERANCE } from '@/features/board/canvas/reactflow-adapter/constants'

export function normalizeNumber(value: number, precision = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function almostEqual(a: number, b: number, tolerance = FLOAT_TOLERANCE): boolean {
  return Math.abs(a - b) <= tolerance
}

export function asFiniteNumber(input: unknown, fallback: number): number {
  return typeof input === 'number' && Number.isFinite(input) ? normalizeNumber(input) : fallback
}

export function asPositiveNumber(input: unknown, fallback: number): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0) {
    return fallback
  }
  return normalizeNumber(input)
}

export function asSemanticNodeType(input: unknown, fallback: SemanticNodeType): SemanticNodeType {
  const parsed = semanticNodeTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}

export function asRelationType(input: unknown, fallback: RelationType): RelationType {
  const parsed = relationTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}
