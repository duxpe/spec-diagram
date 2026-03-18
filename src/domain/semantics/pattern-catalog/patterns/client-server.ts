import type { PatternDefinition } from '../types'

const clientServer: PatternDefinition = {
  id: 'client_server',
  name: 'Client-Server',
  description: 'Clients request services from centralized servers over a network boundary.',
  n1Nodes: [
    { type: 'external_system', patternRole: 'client', label: 'Client', marker: 'CLT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'window', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'server', label: 'Server', marker: 'SRV',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'server', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'app_server', label: 'Application Server', marker: 'APP',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'server', accentColor: 'indigo' } },
    { type: 'database', patternRole: 'db_server', label: 'Database Server', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'container_service', patternRole: 'auth_server', label: 'Auth Server', marker: 'ATH',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'shield', accentColor: 'orange' } },
    { type: 'container_service', patternRole: 'file_server', label: 'File Server', marker: 'FIL',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'server', accentColor: 'neutral' } },
    { type: 'container_service', patternRole: 'load_balancer', label: 'Load Balancer', marker: 'LB',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'purple' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'requests_from', label: 'Requests From', sourceRoles: ['client'], targetRoles: ['server', 'app_server', 'load_balancer'] },
    { type: 'responds_to', label: 'Responds To', sourceRoles: ['server', 'app_server'], targetRoles: ['client'] },
    { type: 'authenticates_with', label: 'Authenticates With', sourceRoles: ['client', 'server'], targetRoles: ['auth_server'] },
    { type: 'reads', label: 'Reads From', sourceRoles: ['app_server', 'server'], targetRoles: ['db_server'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['app_server', 'server'], targetRoles: ['db_server'] },
    { type: 'routes_to', label: 'Routes To', sourceRoles: ['load_balancer'], targetRoles: ['server', 'app_server'] },
    { type: 'serves', label: 'Serves' },
    { type: 'depends_on', label: 'Depends On' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'client', suggestedTargetRoles: ['server', 'load_balancer', 'app_server'], defaultRelationType: 'requests_from' },
    { sourceRole: 'server', suggestedTargetRoles: ['db_server', 'auth_server', 'file_server'], defaultRelationType: 'reads' },
    { sourceRole: 'load_balancer', suggestedTargetRoles: ['server', 'app_server'], defaultRelationType: 'routes_to' },
    { sourceRole: 'app_server', suggestedTargetRoles: ['db_server', 'auth_server'], defaultRelationType: 'reads' },
  ],
}

export default clientServer
