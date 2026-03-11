import { ComponentType } from 'react'
import {
  AppWindow,
  ArrowDown,
  ArrowUp,
  Box,
  Brackets,
  Cable,
  Cuboid,
  Database,
  Filter,
  FunctionSquare,
  GitBranch,
  Globe,
  Grid3X3,
  KeyRound,
  Layers,
  MessageSquare,
  Plug,
  Puzzle,
  Server,
  Settings,
  Shield,
  User
} from 'lucide-react'
import { GenericIconId } from '@/domain/models/node-appearance'

type IconProps = { size?: number | string; color?: string }

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
  'arrow-up': ArrowUp,
  user: User,
  shield: Shield,
  gear: Settings,
  'message-queue': MessageSquare,
  puzzle: Puzzle,
  server: Server,
  funnel: Filter,
  window: AppWindow
}

export function GenericNodeIcon({ iconId, size = 16, color }: { iconId: GenericIconId; size?: number; color?: string }): JSX.Element {
  const IconComponent = GENERIC_ICON_COMPONENTS[iconId]

  if (!IconComponent) {
    return <span aria-hidden="true">•</span>
  }

  return <IconComponent size={size} color={color} />
}
