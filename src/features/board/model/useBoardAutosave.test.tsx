import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBoardAutosave } from '@/features/board/model/useBoardAutosave'
import { useBoardStore } from '@/features/board/model/board-store'

function AutosaveHarness(): JSX.Element {
  useBoardAutosave()
  return <div>autosave</div>
}

const originalSaveCurrentBoard = useBoardStore.getState().saveCurrentBoard

describe('useBoardAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBoardStore.setState({
      dirty: false,
      saveCurrentBoard: originalSaveCurrentBoard
    })
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    useBoardStore.setState({
      dirty: false,
      saveCurrentBoard: originalSaveCurrentBoard
    })
  })

  it('saves after debounce when board is dirty', () => {
    const saveSpy = vi.fn(async () => true)
    useBoardStore.setState({
      dirty: true,
      saveCurrentBoard: saveSpy
    })

    render(<AutosaveHarness />)

    vi.advanceTimersByTime(799)
    expect(saveSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('does not force save during cleanup before debounce fires', () => {
    const saveSpy = vi.fn(async () => true)
    useBoardStore.setState({
      dirty: true,
      saveCurrentBoard: saveSpy
    })

    const view = render(<AutosaveHarness />)
    view.unmount()

    expect(saveSpy).not.toHaveBeenCalled()
  })
})
