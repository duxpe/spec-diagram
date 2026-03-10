import { SemanticNodeType } from '@/domain/models/semantic-node'

export interface N3NodePaletteItem {
  type: SemanticNodeType
  label: string
  marker: string
  group: 'Members' | 'Notes'
}

export const N3_NODE_PALETTE: N3NodePaletteItem[] = [
  { type: 'method', label: 'Method', marker: 'MTH', group: 'Members' },
  { type: 'attribute', label: 'Attribute', marker: 'ATR', group: 'Members' },
  { type: 'free_note_input', label: 'Free Note Input', marker: 'IN', group: 'Notes' },
  { type: 'free_note_output', label: 'Free Note Output', marker: 'OUT', group: 'Notes' }
]
