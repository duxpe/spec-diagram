import type { PatternDefinition } from '../types'

const spaceBased: PatternDefinition = {
  id: 'space_based',
  name: 'Space-Based Architecture',
  description: 'Processing units with in-memory data grids, messaging, and replication for high scalability.',
  n1Nodes: [
    { type: 'container_service', patternRole: 'processing_unit', label: 'Processing Unit', marker: 'PU',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'cube', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'messaging_grid', label: 'Messaging Grid', marker: 'MSG',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'message-queue', accentColor: 'purple' } },
    { type: 'container_service', patternRole: 'processing_grid', label: 'Processing Grid', marker: 'PGR',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'grid', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'replication_engine', label: 'Replication Engine', marker: 'RPL',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'layers', accentColor: 'indigo' } },
    { type: 'container_service', patternRole: 'data_pump', label: 'Data Pump', marker: 'PMP',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'bridge', accentColor: 'cyan' } },
    { type: 'container_service', patternRole: 'data_writer', label: 'Data Writer', marker: 'DWR',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'arrow-down', accentColor: 'green' } },
    { type: 'container_service', patternRole: 'data_reader', label: 'Data Reader', marker: 'DRD',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'arrow-up', accentColor: 'green' } },
    { type: 'database', patternRole: 'persistent_database', label: 'Persistent Database', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'external_system', patternRole: 'external_system', label: 'External System', marker: 'EXT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'routes_to', label: 'Routes To', sourceRoles: ['messaging_grid'], targetRoles: ['processing_unit'] },
    { type: 'replicates_to', label: 'Replicates To', sourceRoles: ['replication_engine'], targetRoles: ['processing_grid', 'processing_unit'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['data_writer', 'processing_unit'], targetRoles: ['persistent_database'] },
    { type: 'reads', label: 'Reads From', sourceRoles: ['data_reader'], targetRoles: ['persistent_database'] },
    { type: 'publishes_to', label: 'Publishes To' },
    { type: 'consumes_from', label: 'Consumes From' },
    { type: 'synchronizes_with', label: 'Synchronizes With' },
    { type: 'depends_on', label: 'Depends On' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'messaging_grid', suggestedTargetRoles: ['processing_unit', 'processing_grid'], defaultRelationType: 'routes_to' },
    { sourceRole: 'processing_unit', suggestedTargetRoles: ['data_writer', 'messaging_grid', 'persistent_database'], defaultRelationType: 'writes' },
    { sourceRole: 'replication_engine', suggestedTargetRoles: ['processing_grid', 'processing_unit'], defaultRelationType: 'replicates_to' },
    { sourceRole: 'data_reader', suggestedTargetRoles: ['persistent_database', 'processing_unit'], defaultRelationType: 'reads' },
  ],
}

export default spaceBased
