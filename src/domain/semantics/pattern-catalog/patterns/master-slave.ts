import type { PatternDefinition } from '../types'

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

export default masterSlave
