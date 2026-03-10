import { ComponentType } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Box,
  Brackets,
  Cable,
  Cuboid,
  Database,
  FunctionSquare,
  GitBranch,
  Globe,
  Grid3X3,
  KeyRound,
  Layers,
  Plug
} from 'lucide-react'
import { GenericIconId } from '@/domain/models/node-appearance'

type IconProps = { size?: number | string }

const GENERIC_ICON_COMPONENTS: Record<GenericIconId, ComponentType<IconProps>> = {
  grid: Grid3X3,
  cube: Cuboid,
  database: Database,
  globe: Globe,
  brackets: Brackets,
  'git-branch': GitBranch,
  box: Box,
  layers: Layers,
  plug: Plug,
  bridge: Cable,
  'function-square': FunctionSquare,
  'key-round': KeyRound,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp
}

export function GenericNodeIcon({ iconId, size = 16 }: { iconId: GenericIconId; size?: number }): JSX.Element {
  const IconComponent = GENERIC_ICON_COMPONENTS[iconId]

  if (!IconComponent) {
    return <span aria-hidden="true">•</span>
  }

  return <IconComponent size={size} />
}
