import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBoardAutosave } from '@/features/board/model/useBoardAutosave'
import { useBoardStore } from '@/features/board/model/board-store'
import { flushCurrentBoardSnapshot } from '@/infrastructure/db/recovery-subscriptions'

vi.mock('@/infrastructure/db/recovery-subscriptions', () => ({
  flushCurrentBoardSnapshot: vi.fn()
}))

const flushCurrentBoardSnapshotMock = flushCurrentBoardSnapshot as unknown as ReturnType<typeof vi.fn>

function AutosaveHarness(): JSX.Element {
  useBoardAutosave()
  return <div>autosave</div>
}

const originalSaveCurrentBoard = useBoardStore.getState().saveCurrentBoard

describe('useBoardAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    flushCurrentBoardSnapshotMock.mockReset()
    useBoardStore.setState({
      dirty: false,
      saveCurrentBoard: originalSaveCurrentBoard
    })
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })
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

  it('flushes save on pagehide when board is dirty', () => {
    const saveSpy = vi.fn(async () => true)
    useBoardStore.setState({
      dirty: true,
      saveCurrentBoard: saveSpy
    })

    render(<AutosaveHarness />)
    window.dispatchEvent(new Event('pagehide'))

    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('flushes save when document becomes hidden while dirty', () => {
    const saveSpy = vi.fn(async () => true)
    useBoardStore.setState({
      dirty: true,
      saveCurrentBoard: saveSpy
    })

    render(<AutosaveHarness />)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('flushes recovery snapshot and save on beforeunload while dirty', () => {
    const saveSpy = vi.fn(async () => true)
    useBoardStore.setState({
      dirty: true,
      saveCurrentBoard: saveSpy
    })

    render(<AutosaveHarness />)
    window.dispatchEvent(new Event('beforeunload'))

    expect(flushCurrentBoardSnapshotMock).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })
})
