import type { PatternDefinition } from '../types'

const layeredNTier: PatternDefinition = {
  id: 'layered_n_tier',
  name: 'Layered (N-Tier)',
  description: 'Horizontal layers with strict downward dependency flow — presentation, business, and data access tiers.',
  n1Nodes: [
    { type: 'container_service', patternRole: 'presentation_layer', label: 'Presentation Layer', marker: 'PRS',
      defaultAppearance: { shapeVariant: 'layer_rectangle', icon: 'window', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'business_layer', label: 'Business Layer', marker: 'BIZ',
      defaultAppearance: { shapeVariant: 'layer_rectangle', icon: 'cube', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'data_access_layer', label: 'Data Access Layer', marker: 'DAL',
      defaultAppearance: { shapeVariant: 'layer_rectangle', icon: 'layers', accentColor: 'indigo' } },
    { type: 'database', patternRole: 'data_tier', label: 'Data Tier', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'external_system', patternRole: 'external_service', label: 'External Service', marker: 'EXT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'calls', label: 'Calls', sourceRoles: ['presentation_layer'], targetRoles: ['business_layer'] },
    { type: 'calls', label: 'Calls', sourceRoles: ['business_layer'], targetRoles: ['data_access_layer'] },
    { type: 'reads', label: 'Reads From', sourceRoles: ['data_access_layer'], targetRoles: ['data_tier'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['data_access_layer'], targetRoles: ['data_tier'] },
    { type: 'depends_on', label: 'Depends On' },
    { type: 'uses', label: 'Uses' },
    { type: 'serves', label: 'Serves' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'presentation_layer', suggestedTargetRoles: ['business_layer', 'external_service'], defaultRelationType: 'calls' },
    { sourceRole: 'business_layer', suggestedTargetRoles: ['data_access_layer', 'data_tier'], defaultRelationType: 'calls' },
    { sourceRole: 'data_access_layer', suggestedTargetRoles: ['data_tier', 'external_service'], defaultRelationType: 'reads' },
  ],
}

export default layeredNTier
