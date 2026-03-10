export interface Workspace {
  id: string
  name: string
  description?: string
  rootBoardId: string
  boardIds: string[]
  createdAt: string
  updatedAt: string
}
