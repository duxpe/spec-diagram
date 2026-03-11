import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { RelationType } from '@/domain/models/relation'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/workspace'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PatternNodeEntry {
  type: SemanticNodeType
  patternRole: string
  label: string
  marker: string
  defaultAppearance?: Partial<NodeAppearance>
}

export interface PatternRelationEntry {
  type: RelationType
  label: string
  sourceRoles?: string[]
  targetRoles?: string[]
}

export interface PatternNextNodeSuggestion {
  sourceRole: string
  suggestedTargetRoles: string[]
  defaultRelationType: RelationType
}

export interface PatternDefinition {
  id: ArchitecturePattern
  name: string
  description: string
  n1Nodes: PatternNodeEntry[]
  n1Relations: PatternRelationEntry[]
  nextNodeSuggestions: PatternNextNodeSuggestion[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Hexagonal
// ─────────────────────────────────────────────────────────────────────────────

const hexagonal: PatternDefinition = {
  id: 'hexagonal',
  name: 'Hexagonal Architecture',
  description: 'Ports & Adapters — isolates domain logic from external dependencies through explicit ports and adapters.',
  n1Nodes: [
    { type: 'system', patternRole: 'application_core', label: 'Application Core', marker: 'COR',
      defaultAppearance: { shapeVariant: 'hexagon', icon: 'grid', accentColor: 'cyan' } },
    { type: 'port', patternRole: 'inbound_port', label: 'Inbound Port', marker: 'IPT',
      defaultAppearance: { shapeVariant: 'oval', icon: 'plug', accentColor: 'teal' } },
    { type: 'port', patternRole: 'outbound_port', label: 'Outbound Port', marker: 'OPT',
      defaultAppearance: { shapeVariant: 'oval', icon: 'plug', accentColor: 'teal' } },
    { type: 'adapter', patternRole: 'inbound_adapter', label: 'Inbound Adapter', marker: 'IAD',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'bridge', accentColor: 'blue' } },
    { type: 'adapter', patternRole: 'outbound_adapter', label: 'Outbound Adapter', marker: 'OAD',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'bridge', accentColor: 'blue' } },
    { type: 'external_system', patternRole: 'external_actor', label: 'External Actor', marker: 'EXT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'database', patternRole: 'persistence', label: 'Persistence Store', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN',
      defaultAppearance: { shapeVariant: 'cloud', icon: 'arrow-down', accentColor: 'green' } },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT',
      defaultAppearance: { shapeVariant: 'cloud', icon: 'arrow-up', accentColor: 'cyan' } },
  ],
  n1Relations: [
    { type: 'exposes_port', label: 'Exposes Port', sourceRoles: ['application_core'], targetRoles: ['inbound_port', 'outbound_port'] },
    { type: 'implemented_by_adapter', label: 'Implemented by Adapter', sourceRoles: ['inbound_port', 'outbound_port'], targetRoles: ['inbound_adapter', 'outbound_adapter'] },
    { type: 'invokes', label: 'Invokes', sourceRoles: ['inbound_adapter'], targetRoles: ['inbound_port'] },
    { type: 'calls', label: 'Calls', sourceRoles: ['inbound_port'], targetRoles: ['application_core'] },
    { type: 'uses', label: 'Uses', sourceRoles: ['application_core'], targetRoles: ['outbound_port'] },
    { type: 'depends_on', label: 'Depends On' },
    { type: 'reads', label: 'Reads From', sourceRoles: ['outbound_adapter'], targetRoles: ['persistence'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['outbound_adapter'], targetRoles: ['persistence'] },
    { type: 'communicates_with', label: 'Communicates With', sourceRoles: ['outbound_adapter'], targetRoles: ['external_actor'] },
    { type: 'publishes_to', label: 'Publishes To' },
    { type: 'subscribes_to', label: 'Subscribes To' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'application_core', suggestedTargetRoles: ['inbound_port', 'outbound_port', 'persistence', 'external_actor'], defaultRelationType: 'exposes_port' },
    { sourceRole: 'inbound_port', suggestedTargetRoles: ['inbound_adapter', 'application_core', 'external_actor'], defaultRelationType: 'implemented_by_adapter' },
    { sourceRole: 'outbound_port', suggestedTargetRoles: ['outbound_adapter', 'application_core'], defaultRelationType: 'implemented_by_adapter' },
    { sourceRole: 'inbound_adapter', suggestedTargetRoles: ['inbound_port', 'external_actor'], defaultRelationType: 'invokes' },
    { sourceRole: 'outbound_adapter', suggestedTargetRoles: ['persistence', 'external_actor', 'outbound_port'], defaultRelationType: 'writes' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Layered (N-Tier)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Microservices
// ─────────────────────────────────────────────────────────────────────────────

const microservices: PatternDefinition = {
  id: 'microservices',
  name: 'Microservices',
  description: 'Independently deployable services communicating through APIs and messaging, each with its own data store.',
  n1Nodes: [
    { type: 'container_service', patternRole: 'microservice', label: 'Microservice', marker: 'SVC',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'cube', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'api_gateway', label: 'API Gateway', marker: 'GW',
      defaultAppearance: { shapeVariant: 'trapezoid', icon: 'server', accentColor: 'indigo' } },
    { type: 'database', patternRole: 'datastore', label: 'Data Store', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'external_system', patternRole: 'external_system', label: 'External System', marker: 'EXT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'container_service', patternRole: 'message_broker', label: 'Message Broker', marker: 'BRK',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'message-queue', accentColor: 'purple' } },
    { type: 'container_service', patternRole: 'service_registry', label: 'Service Registry', marker: 'REG',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'gear', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'config_service', label: 'Config Service', marker: 'CFG',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'gear', accentColor: 'neutral' } },
    { type: 'container_service', patternRole: 'observability', label: 'Observability Stack', marker: 'OBS',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'layers', accentColor: 'green' } },
    { type: 'container_service', patternRole: 'auth_service', label: 'Identity / Auth Service', marker: 'ATH',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'shield', accentColor: 'orange' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'routes_to', label: 'Routes To', sourceRoles: ['api_gateway'], targetRoles: ['microservice'] },
    { type: 'calls', label: 'Calls', sourceRoles: ['microservice'], targetRoles: ['microservice'] },
    { type: 'communicates_with', label: 'Communicates With', sourceRoles: ['microservice'], targetRoles: ['microservice', 'external_system'] },
    { type: 'reads', label: 'Reads From', sourceRoles: ['microservice'], targetRoles: ['datastore'] },
    { type: 'writes', label: 'Writes To', sourceRoles: ['microservice'], targetRoles: ['datastore'] },
    { type: 'publishes_to', label: 'Publishes To', sourceRoles: ['microservice'], targetRoles: ['message_broker'] },
    { type: 'subscribes_to', label: 'Subscribes To', sourceRoles: ['microservice'], targetRoles: ['message_broker'] },
    { type: 'authenticates_with', label: 'Authenticates With', sourceRoles: ['microservice', 'api_gateway'], targetRoles: ['auth_service'] },
    { type: 'registers_in', label: 'Registers In', sourceRoles: ['microservice'], targetRoles: ['service_registry'] },
    { type: 'depends_on', label: 'Depends On' },
    { type: 'uses', label: 'Uses' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'api_gateway', suggestedTargetRoles: ['microservice', 'auth_service'], defaultRelationType: 'routes_to' },
    { sourceRole: 'microservice', suggestedTargetRoles: ['datastore', 'message_broker', 'external_system', 'microservice'], defaultRelationType: 'calls' },
    { sourceRole: 'message_broker', suggestedTargetRoles: ['microservice'], defaultRelationType: 'subscribes_to' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Microkernel
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// MVC
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Space-Based
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Client-Server
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Master-Slave
// ─────────────────────────────────────────────────────────────────────────────

const masterSlave: PatternDefinition = {
  id: 'master_slave',
  name: 'Master-Slave',
  description: 'A master coordinates work distribution to slave/worker nodes and aggregates results.',
  n1Nodes: [
    { type: 'container_service', patternRole: 'master', label: 'Master', marker: 'MST',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'grid', accentColor: 'blue' } },
    { type: 'container_service', patternRole: 'worker', label: 'Worker / Slave', marker: 'WRK',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'cube', accentColor: 'teal' } },
    { type: 'container_service', patternRole: 'scheduler', label: 'Scheduler / Dispatcher', marker: 'SCH',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'container_service', patternRole: 'result_collector', label: 'Result Collector', marker: 'COL',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'funnel', accentColor: 'purple' } },
    { type: 'container_service', patternRole: 'task_queue', label: 'Task Queue', marker: 'TQ',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'message-queue', accentColor: 'indigo' } },
    { type: 'database', patternRole: 'shared_store', label: 'Shared Store', marker: 'DB',
      defaultAppearance: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' } },
    { type: 'external_system', patternRole: 'client', label: 'Client / Initiator', marker: 'CLT',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' } },
    { type: 'container_service', patternRole: 'health_monitor', label: 'Health Monitor', marker: 'MON',
      defaultAppearance: { shapeVariant: 'rectangle', icon: 'shield', accentColor: 'green' } },
    { type: 'decision', patternRole: 'decision', label: 'Decision', marker: 'DEC',
      defaultAppearance: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' } },
    { type: 'free_note_input', patternRole: 'note_in', label: 'Free Note Input', marker: 'IN' },
    { type: 'free_note_output', patternRole: 'note_out', label: 'Free Note Output', marker: 'OUT' },
  ],
  n1Relations: [
    { type: 'delegates_to', label: 'Delegates To', sourceRoles: ['master'], targetRoles: ['worker'] },
    { type: 'returns_to', label: 'Returns To', sourceRoles: ['worker'], targetRoles: ['master', 'result_collector'] },
    { type: 'queues_for', label: 'Queues For', sourceRoles: ['master'], targetRoles: ['task_queue'] },
    { type: 'aggregates_from', label: 'Aggregates From', sourceRoles: ['result_collector'], targetRoles: ['master', 'worker'] },
    { type: 'monitors', label: 'Monitors', sourceRoles: ['health_monitor'], targetRoles: ['master', 'worker'] },
    { type: 'reads', label: 'Reads From', targetRoles: ['shared_store'] },
    { type: 'writes', label: 'Writes To', targetRoles: ['shared_store'] },
    { type: 'depends_on', label: 'Depends On' },
  ],
  nextNodeSuggestions: [
    { sourceRole: 'master', suggestedTargetRoles: ['worker', 'task_queue', 'result_collector'], defaultRelationType: 'delegates_to' },
    { sourceRole: 'worker', suggestedTargetRoles: ['master', 'result_collector', 'shared_store'], defaultRelationType: 'returns_to' },
    { sourceRole: 'scheduler', suggestedTargetRoles: ['master', 'worker', 'task_queue'], defaultRelationType: 'delegates_to' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

export const PATTERN_CATALOG: Record<ArchitecturePattern, PatternDefinition> = {
  hexagonal,
  layered_n_tier: layeredNTier,
  microservices,
  microkernel,
  mvc,
  space_based: spaceBased,
  client_server: clientServer,
  master_slave: masterSlave,
}

export function getPatternDefinition(pattern: ArchitecturePattern): PatternDefinition {
  return PATTERN_CATALOG[pattern]
}

export function getPatternNodeByRole(
  pattern: ArchitecturePattern,
  role: string
): PatternNodeEntry | undefined {
  return PATTERN_CATALOG[pattern]?.n1Nodes.find((n) => n.patternRole === role)
}
