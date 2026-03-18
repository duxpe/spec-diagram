import type { PatternDefinition } from '../types'

const mvc: PatternDefinition = {
  id: 'mvc',
  name: 'Model-View-Controller',
  description: 'Separates application into Model (data), View (UI), and Controller (logic) for clear responsibility.',
  n1Nodes: [
    { type: 'external_system', patternRole: 'user', label: 'User', marker: 'USR',
      defaultAppearance: { shapeVariant: 'stick_figure', icon: 'user', accentColor: 'gray' } },
    { type: 'container_service', patternRole: 'router', label: 'Router / Dispatcher', marker: 'RTR',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'container_service', patternRole: 'controller', label: 'Controller', marker: 'CTL',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'cube', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'view', label: 'View', marker: 'VW',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'window', accentColor: 'green' } },
    { type: 'container_service', patternRole: 'model', label: 'Model', marker: 'MDL',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'box', accentColor: 'purple' } },
    { type: 'container_service', patternRole: 'service_layer', label: 'Service / Domain Layer', marker: 'SVC',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'layers', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'repository', label: 'Repository / Data Access', marker: 'REP',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'layers', accentColor: 'indigo' } },
    { type: 'database', patternRole: 'database', label: 'Database', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'external_system', patternRole: 'external_api', label: 'External API', marker: 'EXT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'routes_to', label: 'Routes To', sourceRoles: ['router'], targetRoles: ['controller'] },
    { type: 'calls', label: 'Calls', sourceRoles: ['controller'], targetRoles: ['model', 'service_layer'] },
    { type: 'renders', label: 'Renders', sourceRoles: ['controller'], targetRoles: ['view'] },
    { type: 'updates', label: 'Updates', sourceRoles: ['model'], targetRoles: ['view'] },
    { type: 'reads', label: 'Reads From', sourceRoles: ['model', 'repository'], targetRoles: ['database'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['model', 'repository'], targetRoles: ['database'] },
    { type: 'uses', label: 'Uses' },
    { type: 'depends_on', label: 'Depends On' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'router', suggestedTargetRoles: ['controller'], defaultRelationType: 'routes_to' },
    { sourceRole: 'controller', suggestedTargetRoles: ['model', 'view', 'service_layer', 'repository'], defaultRelationType: 'calls' },
    { sourceRole: 'model', suggestedTargetRoles: ['database', 'view'], defaultRelationType: 'reads' },
  ],
}

export default mvc
