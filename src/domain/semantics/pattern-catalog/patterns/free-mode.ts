import { N1_NODE_PALETTE } from '@/domain/semantics/n1-node-palette'
import { ALL_RELATION_TYPES } from '@/domain/semantics/semantic-catalog/constants'
import type { PatternDefinition } from '../types'

function toRelationLabel(type: string): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const freeMode: PatternDefinition = {
  id: 'free_mode',
  name: 'Free Mode',
  description:
    'Unrestricted planning mode with the full N1 node palette and all relation types available.',
  n1Nodes: N1_NODE_PALETTE.map((item) => ({
    type: item.type,
    patternRole: item.type,
    label: item.label,
    marker: item.marker
  })),
  n1Relations: ALL_RELATION_TYPES.map((type) => ({
    type,
    label: toRelationLabel(type)
  })),
  nextNodeSuggestions: []
}

export default freeMode
