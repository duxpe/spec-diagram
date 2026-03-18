export type ArchitecturePattern =
  | 'free_mode'
  | 'hexagonal'
  | 'layered_n_tier'
  | 'microservices'
  | 'microkernel'
  | 'mvc'
  | 'space_based'
  | 'client_server'
  | 'master_slave'

export interface ProjectBrief {
  goal?: string
  context?: string
  scopeIn?: string[]
  scopeOut?: string[]
  constraints?: string[]
  nfrs?: string[]
  globalDecisions?: string[]
}

export interface Project {
  id: string
  name: string
  description?: string
  brief?: ProjectBrief
  rootBoardId: string
  boardIds: string[]
  architecturePattern?: ArchitecturePattern
  createdAt: string
  updatedAt: string
}
