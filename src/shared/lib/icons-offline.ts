import { addCollection } from '@iconify/react'
import simpleIconsData from '@iconify-json/simple-icons/icons.json'

// Icons used in CLOUD_SERVICE_OPTIONS — bundled locally for offline access
const NEEDED_ICONS = [
  'amazonec2',
  'awslambda',
  'amazonecs',
  'amazons3',
  'amazonrds',
  'amazondynamodb',
  'amazonapigateway',
  'microsoftazure',
  'azurefunctions',
  'kubernetes',
  'microsoftsqlserver',
  'googlecloud',
  'googlecloudstorage',
  'mysql',
  'firebase'
] as const

export function registerOfflineIcons(): void {
  const icons = simpleIconsData.icons as Record<string, { body: string }>
  addCollection({
    prefix: 'simple-icons',
    width: 24,
    height: 24,
    icons: Object.fromEntries(NEEDED_ICONS.flatMap((id) => {
      const icon = icons[id]
      return icon ? [[id, icon] as const] : []
    }))
  })
}
