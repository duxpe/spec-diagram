import {
  AccentColorToken,
  CloudServiceOption,
  GenericIconId,
  NodeAppearance,
  ProviderServiceId,
  ResolvedNodeVisual,
  VisualDefaults,
  VisualProvider
} from '@/domain/models/node-appearance'
import type { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { providerServiceIdSchema } from '@/domain/schemas/node-appearance.schema'

interface NodeVisualOption {
  id: GenericIconId
  label: string
}

const DEFAULT_PROVIDER: VisualProvider = 'none'

const DEFAULTS_BY_TYPE: Record<SemanticNodeType, VisualDefaults> = {
  system: { shapeVariant: 'rectangle', icon: 'grid', accentColor: 'cyan' },
  container_service: { shapeVariant: 'rectangle', icon: 'cube', accentColor: 'teal' },
  database: { shapeVariant: 'cylinder', icon: 'database', accentColor: 'amber' },
  external_system: { shapeVariant: 'rectangle', icon: 'globe', accentColor: 'gray' },
  api_contract: { shapeVariant: 'rhombus', icon: 'brackets', accentColor: 'indigo' },
  decision: { shapeVariant: 'diamond', icon: 'git-branch', accentColor: 'orange' },
  class: { shapeVariant: 'rectangle', icon: 'box', accentColor: 'blue' },
  interface: { shapeVariant: 'rectangle', icon: 'layers', accentColor: 'purple' },
  port: { shapeVariant: 'oval', icon: 'plug', accentColor: 'cyan' },
  adapter: { shapeVariant: 'trapezoid', icon: 'bridge', accentColor: 'teal' },
  free_note_input: { shapeVariant: 'cloud', icon: 'arrow-down', accentColor: 'green' },
  free_note_output: { shapeVariant: 'cloud', icon: 'arrow-up', accentColor: 'cyan' }
}

const GENERIC_ICON_OPTIONS: NodeVisualOption[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'cube', label: 'Cube' },
  { id: 'database', label: 'Database' },
  { id: 'globe', label: 'Globe' },
  { id: 'brackets', label: 'Brackets' },
  { id: 'git-branch', label: 'Branch' },
  { id: 'box', label: 'Box' },
  { id: 'layers', label: 'Layers' },
  { id: 'plug', label: 'Plug' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'function-square', label: 'Function' },
  { id: 'key-round', label: 'Key' },
  { id: 'arrow-down', label: 'Arrow Down' },
  { id: 'arrow-up', label: 'Arrow Up' },
  { id: 'user', label: 'User' },
  { id: 'shield', label: 'Shield' },
  { id: 'gear', label: 'Gear' },
  { id: 'message-queue', label: 'Message Queue' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'server', label: 'Server' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'window', label: 'Window' }
]

const CLOUD_SERVICE_OPTIONS: CloudServiceOption[] = [
  { id: 'aws_ec2', provider: 'aws', label: 'EC2', icon: 'simple-icons:amazonec2' },
  { id: 'aws_lambda', provider: 'aws', label: 'Lambda', icon: 'simple-icons:awslambda' },
  { id: 'aws_ecs', provider: 'aws', label: 'ECS', icon: 'simple-icons:amazonecs' },
  { id: 'aws_s3', provider: 'aws', label: 'S3', icon: 'simple-icons:amazons3' },
  { id: 'aws_rds', provider: 'aws', label: 'RDS', icon: 'simple-icons:amazonrds' },
  {
    id: 'aws_dynamodb',
    provider: 'aws',
    label: 'DynamoDB',
    icon: 'simple-icons:amazondynamodb'
  },
  {
    id: 'aws_apigateway',
    provider: 'aws',
    label: 'API Gateway',
    icon: 'simple-icons:amazonapigateway'
  },
  {
    id: 'azure_app_service',
    provider: 'azure',
    label: 'App Service',
    icon: 'simple-icons:microsoftazure'
  },
  {
    id: 'azure_functions',
    provider: 'azure',
    label: 'Functions',
    icon: 'simple-icons:azurefunctions'
  },
  { id: 'azure_aks', provider: 'azure', label: 'AKS', icon: 'simple-icons:kubernetes' },
  {
    id: 'azure_blob_storage',
    provider: 'azure',
    label: 'Blob Storage',
    icon: 'simple-icons:microsoftazure'
  },
  {
    id: 'azure_sql_database',
    provider: 'azure',
    label: 'Azure SQL',
    icon: 'simple-icons:microsoftsqlserver'
  },
  {
    id: 'azure_cosmos_db',
    provider: 'azure',
    label: 'Cosmos DB',
    icon: 'simple-icons:microsoftazure'
  },
  {
    id: 'azure_api_management',
    provider: 'azure',
    label: 'API Management',
    icon: 'simple-icons:microsoftazure'
  },
  {
    id: 'gcp_cloud_run',
    provider: 'gcp',
    label: 'Cloud Run',
    icon: 'simple-icons:googlecloud'
  },
  { id: 'gcp_gke', provider: 'gcp', label: 'GKE', icon: 'simple-icons:kubernetes' },
  {
    id: 'gcp_cloud_functions',
    provider: 'gcp',
    label: 'Cloud Functions',
    icon: 'simple-icons:googlecloud'
  },
  {
    id: 'gcp_cloud_storage',
    provider: 'gcp',
    label: 'Cloud Storage',
    icon: 'simple-icons:googlecloudstorage'
  },
  { id: 'gcp_cloud_sql', provider: 'gcp', label: 'Cloud SQL', icon: 'simple-icons:mysql' },
  { id: 'gcp_firestore', provider: 'gcp', label: 'Firestore', icon: 'simple-icons:firebase' },
  { id: 'gcp_pubsub', provider: 'gcp', label: 'Pub/Sub', icon: 'simple-icons:googlecloud' }
]

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'oval', label: 'Oval' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'rhombus', label: 'Rhombus' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'stick_figure', label: 'Stick Figure' },
  { value: 'layer_rectangle', label: 'Layer' }
] as const

const ACCENT_OPTIONS = [
  { value: 'cyan', label: 'Cyan' },
  { value: 'teal', label: 'Teal' },
  { value: 'amber', label: 'Amber' },
  { value: 'gray', label: 'Gray' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'orange', label: 'Orange' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'neutral', label: 'Neutral' }
] as const

const PROVIDER_LABEL: Record<VisualProvider, string> = {
  none: 'None',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP'
}

export function getDefaultAppearance(nodeType: SemanticNodeType): VisualDefaults {
  return DEFAULTS_BY_TYPE[nodeType]
}

export function resolveNodeVisual(node: Pick<SemanticNode, 'type' | 'appearance'>): ResolvedNodeVisual {
  const defaults = getDefaultAppearance(node.type)
  const appearance = node.appearance ?? {}
  const provider = appearance.provider ?? DEFAULT_PROVIDER

  const providerService =
    provider === 'none' || !appearance.providerService
      ? undefined
      : getCloudServiceOptions(provider).some((item) => item.id === appearance.providerService)
        ? appearance.providerService
        : undefined

  return {
    shapeVariant: appearance.shapeVariant ?? defaults.shapeVariant,
    icon: appearance.icon ?? defaults.icon,
    accentColor: appearance.accentColor ?? defaults.accentColor,
    provider,
    providerService,
    showProviderBadge: appearance.showProviderBadge ?? false
  }
}

export function getCloudServiceOptions(provider: VisualProvider): CloudServiceOption[] {
  if (provider === 'none') return []
  return CLOUD_SERVICE_OPTIONS.filter((item) => item.provider === provider)
}

export function isProviderServiceAllowed(provider: VisualProvider, serviceId: string): boolean {
  if (provider === 'none') return false
  const parsed = providerServiceIdSchema.safeParse(serviceId)
  if (!parsed.success) return false
  return getCloudServiceOptions(provider).some((item) => item.id === parsed.data)
}

export function getProviderLabel(provider: VisualProvider): string {
  return PROVIDER_LABEL[provider]
}

export function getGenericIconOptions(): NodeVisualOption[] {
  return GENERIC_ICON_OPTIONS
}

export function getShapeOptions(): Array<{ value: string; label: string }> {
  return [...SHAPE_OPTIONS]
}

export function getAccentOptions(): Array<{ value: AccentColorToken; label: string }> {
  return [...ACCENT_OPTIONS]
}

export function getProviderOptions(): Array<{ value: VisualProvider; label: string }> {
  return (
    Object.keys(PROVIDER_LABEL) as VisualProvider[]
  ).map((provider) => ({ value: provider, label: PROVIDER_LABEL[provider] }))
}

export function getCloudServiceById(
  serviceId: ProviderServiceId | undefined
): CloudServiceOption | undefined {
  if (!serviceId) return undefined
  return CLOUD_SERVICE_OPTIONS.find((item) => item.id === serviceId)
}

export function createResetAppearance(): NodeAppearance {
  return {}
}
