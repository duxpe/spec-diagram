import type { PatternDefinition } from '../types'

const microkernel: PatternDefinition = {
  id: 'microkernel',
  name: 'Microkernel (Plug-in)',
  description: 'Minimal core system with plug-in components extending functionality through a defined contract.',
  n1Nodes: [
    { type: 'system', patternRole: 'core_system', label: 'Core System', marker: 'COR',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'grid', accentColor: 'cyan' } },
    { type: 'container_service', patternRole: 'host_application', label: 'Host Application', marker: 'HST',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'window', accentColor: 'blue' } },
    { type: 'port', patternRole: 'plugin_contract', label: 'Plugin Contract', marker: 'CTR',
      defaultAppearance: { shapeVariant: 'oval', icon: 'plug', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'plugin', label: 'Plugin Component', marker: 'PLG',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'puzzle', accentColor: 'purple' } },
    { type: 'container_service', patternRole: 'plugin_registry', label: 'Plugin Registry', marker: 'REG',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'gear', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'loader', label: 'Loader / Runtime Manager', marker: 'LDR',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'gear', accentColor: 'neutral' } },
    { type: 'database', patternRole: 'plugin_store', label: 'Plugin Data Store', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'implements', label: 'Implements', sourceRoles: ['plugin'], targetRoles: ['plugin_contract'] },
    { type: 'loads', label: 'Loads', sourceRoles: ['core_system', 'loader'], targetRoles: ['plugin'] },
    { type: 'invokes', label: 'Invokes', sourceRoles: ['core_system'], targetRoles: ['plugin'] },
    { type: 'registers_in', label: 'Registers In', sourceRoles: ['plugin'], targetRoles: ['plugin_registry'] },
    { type: 'extends', label: 'Extends', sourceRoles: ['plugin'], targetRoles: ['core_system'] },
    { type: 'depends_on', label: 'Depends On' },
    { type: 'reads', label: 'Reads From', targetRoles: ['plugin_store'] },
    { type: 'writes', label: 'Writes To', targetRoles: ['plugin_store'] },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'core_system', suggestedTargetRoles: ['plugin_contract', 'plugin', 'host_application', 'loader'], defaultRelationType: 'invokes' },
    { sourceRole: 'plugin', suggestedTargetRoles: ['plugin_contract', 'plugin_registry', 'plugin_store'], defaultRelationType: 'implements' },
    { sourceRole: 'loader', suggestedTargetRoles: ['plugin', 'plugin_registry'], defaultRelationType: 'loads' },
  ],
}

export default microkernel
