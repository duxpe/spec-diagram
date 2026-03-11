import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/workspace'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'
import { N1_NODE_PALETTE, type N1NodePaletteItem } from '@/domain/semantics/n1-node-palette'

export interface PatternPaletteItem extends N1NodePaletteItem {
  patternRole?: string
  defaultAppearance?: Partial<NodeAppearance>
}

export function getPatternN1Palette(
  pattern?: ArchitecturePattern
): PatternPaletteItem[] {
  if (!pattern) {
    return N1_NODE_PALETTE.map((item) => ({ ...item }))
  }

  const definition = PATTERN_CATALOG[pattern]
  if (!definition) {
    return N1_NODE_PALETTE.map((item) => ({ ...item }))
  }

  return definition.n1Nodes.map((entry) => ({
    type: entry.type as SemanticNodeType,
    label: entry.label,
    marker: entry.marker,
    group: entry.patternRole.includes('note') ? 'Notes' as const : 'Core' as const,
    patternRole: entry.patternRole,
    defaultAppearance: entry.defaultAppearance,
  }))
}
