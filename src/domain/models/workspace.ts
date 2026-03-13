export type ArchitecturePattern =
  | 'hexagonal'
  | 'layered_n_tier'
  | 'microservices'
  | 'microkernel'
  | 'mvc'
  | 'space_based'
  | 'client_server'
  | 'master_slave'

export interface WorkspaceBrief {
  goal?: string
  context?: string
  scopeIn?: string[]
  scopeOut?: string[]
  constraints?: string[]
  nfrs?: string[]
  globalDecisions?: string[]
}

export interface Workspace {
  id: string
  name: string
  description?: string
  brief?: WorkspaceBrief
  rootBoardId: string
  boardIds: string[]
  architecturePattern?: ArchitecturePattern
  createdAt: string
  updatedAt: string
}
