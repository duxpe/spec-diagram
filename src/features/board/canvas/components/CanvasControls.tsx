import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { ZoomControls } from '@/features/board/canvas/RFCanvas'

export function CanvasControls({ onReady }: { onReady?: (ctrl: ZoomControls) => void }): null {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  useEffect(() => {
    if (!onReady) return
    onReady({ zoomIn, zoomOut, fitView })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
