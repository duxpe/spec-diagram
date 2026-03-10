import type { SemanticNodeType } from '@/domain/models/semantic-node'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ActiveTheme = 'light' | 'dark'

export type VisualProvider = 'none' | 'aws' | 'azure' | 'gcp'

export type NodeShapeVariant =
  | 'rectangle'
  | 'oval'
  | 'diamond'
  | 'rhombus'
  | 'trapezoid'
  | 'hexagon'
  | 'cloud'

export type AccentColorToken =
  | 'cyan'
  | 'teal'
  | 'amber'
  | 'gray'
  | 'indigo'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'green'
  | 'neutral'

export type GenericIconId =
  | 'grid'
  | 'cube'
  | 'database'
  | 'globe'
  | 'brackets'
  | 'git-branch'
  | 'box'
  | 'layers'
  | 'plug'
  | 'bridge'
  | 'function-square'
  | 'key-round'
  | 'arrow-down'
  | 'arrow-up'

export type ProviderServiceId =
  | 'aws_ec2'
  | 'aws_lambda'
  | 'aws_ecs'
  | 'aws_s3'
  | 'aws_rds'
  | 'aws_dynamodb'
  | 'aws_apigateway'
  | 'azure_app_service'
  | 'azure_functions'
  | 'azure_aks'
  | 'azure_blob_storage'
  | 'azure_sql_database'
  | 'azure_cosmos_db'
  | 'azure_api_management'
  | 'gcp_cloud_run'
  | 'gcp_gke'
  | 'gcp_cloud_functions'
  | 'gcp_cloud_storage'
  | 'gcp_cloud_sql'
  | 'gcp_firestore'
  | 'gcp_pubsub'

export interface NodeAppearance {
  shapeVariant?: NodeShapeVariant
  icon?: GenericIconId
  provider?: VisualProvider
  providerService?: ProviderServiceId
  accentColor?: AccentColorToken
  showProviderBadge?: boolean
}

export interface CloudServiceOption {
  id: ProviderServiceId
  provider: Exclude<VisualProvider, 'none'>
  label: string
  icon: string
  allowedTypes?: SemanticNodeType[]
}

export interface VisualDefaults {
  shapeVariant: NodeShapeVariant
  icon: GenericIconId
  accentColor: AccentColorToken
}

export interface ResolvedNodeVisual extends VisualDefaults {
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
}
