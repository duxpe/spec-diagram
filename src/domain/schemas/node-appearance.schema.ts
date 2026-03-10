import { z } from 'zod'

export const nodeShapeVariantSchema = z.enum([
  'rectangle',
  'oval',
  'diamond',
  'rhombus',
  'trapezoid',
  'hexagon',
  'cloud'
])

export const genericIconIdSchema = z.enum([
  'grid',
  'cube',
  'database',
  'globe',
  'brackets',
  'git-branch',
  'box',
  'layers',
  'plug',
  'bridge',
  'function-square',
  'key-round',
  'arrow-down',
  'arrow-up'
])

export const visualProviderSchema = z.enum(['none', 'aws', 'azure', 'gcp'])

export const providerServiceIdSchema = z.enum([
  'aws_ec2',
  'aws_lambda',
  'aws_ecs',
  'aws_s3',
  'aws_rds',
  'aws_dynamodb',
  'aws_apigateway',
  'azure_app_service',
  'azure_functions',
  'azure_aks',
  'azure_blob_storage',
  'azure_sql_database',
  'azure_cosmos_db',
  'azure_api_management',
  'gcp_cloud_run',
  'gcp_gke',
  'gcp_cloud_functions',
  'gcp_cloud_storage',
  'gcp_cloud_sql',
  'gcp_firestore',
  'gcp_pubsub'
])

export const accentColorTokenSchema = z.enum([
  'cyan',
  'teal',
  'amber',
  'gray',
  'indigo',
  'orange',
  'blue',
  'purple',
  'green',
  'neutral'
])

export const nodeAppearanceSchema = z
  .object({
    shapeVariant: nodeShapeVariantSchema.optional(),
    icon: genericIconIdSchema.optional(),
    provider: visualProviderSchema.optional(),
    providerService: providerServiceIdSchema.optional(),
    accentColor: accentColorTokenSchema.optional(),
    showProviderBadge: z.boolean().optional()
  })
  .strict()
