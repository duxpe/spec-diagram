import { SemanticNodeType } from '@/domain/models/semantic-node'

export interface N1NodePaletteItem {
  type: SemanticNodeType
  label: string
  marker: string
  group: 'Core' | 'Architecture' | 'Notes'
}

export const N1_NODE_PALETTE: N1NodePaletteItem[] = [
  { type: 'system', label: 'System', marker: 'SYS', group: 'Core' },
  { type: 'container_service', label: 'Container / Service', marker: 'SVC', group: 'Core' },
  { type: 'database', label: 'Database', marker: 'DB', group: 'Core' },
  { type: 'external_system', label: 'External System', marker: 'EXT', group: 'Core' },
  { type: 'port', label: 'Port', marker: 'PRT', group: 'Architecture' },
  { type: 'adapter', label: 'Adapter', marker: 'ADP', group: 'Architecture' },
  { type: 'decision', label: 'Decision', marker: 'DEC', group: 'Architecture' },
  { type: 'free_note_input', label: 'Free Note Input', marker: 'IN', group: 'Notes' },
  { type: 'free_note_output', label: 'Free Note Output', marker: 'OUT', group: 'Notes' }
]
