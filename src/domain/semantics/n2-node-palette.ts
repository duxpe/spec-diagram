import { SemanticNodeType } from '@/domain/models/semantic-node'

export interface N2NodePaletteItem {
  type: SemanticNodeType
  label: string
  marker: string
  group: 'Core' | 'Contracts' | 'Notes'
}

export const N2_NODE_PALETTE: N2NodePaletteItem[] = [
  { type: 'class', label: 'Class', marker: 'CLS', group: 'Core' },
  { type: 'interface', label: 'Interface', marker: 'INT', group: 'Core' },
  { type: 'api_contract', label: 'API Contract', marker: 'API', group: 'Contracts' },
  { type: 'free_note_input', label: 'Free Note Input', marker: 'IN', group: 'Notes' },
  { type: 'free_note_output', label: 'Free Note Output', marker: 'OUT', group: 'Notes' }
]
