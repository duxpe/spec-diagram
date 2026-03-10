import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '@/state/ui-store'

describe('ui-store theme mode', () => {
  beforeEach(() => {
    useUiStore.setState({
      themeMode: 'system',
      selectedNodeId: undefined,
      relationSourceNodeId: undefined,
      relationTargetNodeId: undefined,
      isInspectorOpen: true,
      isExportDialogOpen: false,
      isImportDialogOpen: false
    })
  })

  it('resolves explicit theme mode directly', () => {
    useUiStore.getState().setThemeMode('dark')
    expect(useUiStore.getState().resolveActiveTheme()).toBe('dark')

    useUiStore.getState().setThemeMode('light')
    expect(useUiStore.getState().resolveActiveTheme()).toBe('light')
  })

  it('resolves system theme from media query', () => {
    useUiStore.getState().setThemeMode('system')
    expect(useUiStore.getState().resolveActiveTheme()).toBe('light')
  })
})
