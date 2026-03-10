import { create } from 'zustand'

interface UiState {
  selectedNodeId?: string
  relationSourceNodeId?: string
  relationTargetNodeId?: string
  isInspectorOpen: boolean
  isExportDialogOpen: boolean
  isImportDialogOpen: boolean
  setSelectedNodeId: (nodeId?: string) => void
  setRelationSourceNodeId: (nodeId?: string) => void
  setRelationTargetNodeId: (nodeId?: string) => void
  setInspectorOpen: (open: boolean) => void
  setExportDialogOpen: (open: boolean) => void
  setImportDialogOpen: (open: boolean) => void
  resetRelationDraft: () => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: undefined,
  relationSourceNodeId: undefined,
  relationTargetNodeId: undefined,
  isInspectorOpen: true,
  isExportDialogOpen: false,
  isImportDialogOpen: false,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setRelationSourceNodeId: (relationSourceNodeId) => set({ relationSourceNodeId }),
  setRelationTargetNodeId: (relationTargetNodeId) => set({ relationTargetNodeId }),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  setExportDialogOpen: (isExportDialogOpen) => set({ isExportDialogOpen }),
  setImportDialogOpen: (isImportDialogOpen) => set({ isImportDialogOpen }),
  resetRelationDraft: () =>
    set({
      relationSourceNodeId: undefined,
      relationTargetNodeId: undefined
    })
}))
