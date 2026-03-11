export type ArchitecturePattern =
  | 'hexagonal'
  | 'layered_n_tier'
  | 'microservices'
  | 'microkernel'
  | 'mvc'
  | 'space_based'
  | 'client_server'
  | 'master_slave'

export interface Workspace {
  id: string
  name: string
  description?: string
  rootBoardId: string
  boardIds: string[]
  architecturePattern?: ArchitecturePattern
  createdAt: string
  updatedAt: string
}
