import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ActiveTheme, ThemeMode } from '@/domain/models/node-appearance'

interface UiState {
  selectedNodeId?: string
  relationSourceNodeId?: string
  relationTargetNodeId?: string
  isInspectorOpen: boolean
  isExportDialogOpen: boolean
  isImportDialogOpen: boolean
  themeMode: ThemeMode
  appearanceDialogNodeId?: string
  setSelectedNodeId: (nodeId?: string) => void
  setRelationSourceNodeId: (nodeId?: string) => void
  setRelationTargetNodeId: (nodeId?: string) => void
  setInspectorOpen: (open: boolean) => void
  setExportDialogOpen: (open: boolean) => void
  setImportDialogOpen: (open: boolean) => void
  setThemeMode: (mode: ThemeMode) => void
  setAppearanceDialogNodeId: (nodeId?: string) => void
  resolveActiveTheme: () => ActiveTheme
  resetRelationDraft: () => void
}

function resolveSystemTheme(): ActiveTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      selectedNodeId: undefined,
      relationSourceNodeId: undefined,
      relationTargetNodeId: undefined,
      isInspectorOpen: true,
      isExportDialogOpen: false,
      isImportDialogOpen: false,
      themeMode: 'system',
      appearanceDialogNodeId: undefined,
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      setRelationSourceNodeId: (relationSourceNodeId) => set({ relationSourceNodeId }),
      setRelationTargetNodeId: (relationTargetNodeId) => set({ relationTargetNodeId }),
      setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
      setExportDialogOpen: (isExportDialogOpen) => set({ isExportDialogOpen }),
      setImportDialogOpen: (isImportDialogOpen) => set({ isImportDialogOpen }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setAppearanceDialogNodeId: (appearanceDialogNodeId) => set({ appearanceDialogNodeId }),
      resolveActiveTheme: () => {
        const mode = get().themeMode
        return mode === 'system' ? resolveSystemTheme() : mode
      },
      resetRelationDraft: () =>
        set({
          relationSourceNodeId: undefined,
          relationTargetNodeId: undefined
        })
    }),
    {
      name: 'designer-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ themeMode: state.themeMode })
    }
  )
)
