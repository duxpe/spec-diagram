import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange
} from '@xyflow/react'
import type { SemanticLevel } from '@/domain/models/board'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { fromRFChanges, toRFEdges, toRFNodes } from '@/features/board/canvas/reactflow-adapter'
import {
  createDomainSyncSnapshot,
  resolveDomainSyncSkip,
  type DomainSyncSnapshot
} from '@/features/board/canvas/hooks/useRFDomainSync/snapshot'

interface UseRFDomainSyncInput {
  projectId: string
  boardId: string
  level: SemanticLevel
  semanticNodes: SemanticNode[]
  relations: Relation[]
  onCanvasChange: (boardId: string, nodes: SemanticNode[], relations: Relation[]) => boolean | void
  onNodeContextMenu?: (nodeId: string, screenX: number, screenY: number) => void
}

interface UseRFDomainSyncResult {
  nodes: Node[]
  edges: Edge[]
  setNodes: ReturnType<typeof useNodesState>[1]
  handleNodesChange: (changes: NodeChange[]) => void
  handleEdgesChange: (changes: EdgeChange[]) => void
}

export function useRFDomainSync({
  projectId,
  boardId,
  level,
  semanticNodes,
  relations,
  onCanvasChange,
  onNodeContextMenu
}: UseRFDomainSyncInput): UseRFDomainSyncResult {
  const isApplyingDomainRef = useRef(false)
  const mountedBoardIdentity = useRef(`${projectId}:${boardId}`)
  const onNodeContextMenuRef = useRef(onNodeContextMenu)
  const latestPropsRef = useRef({
    projectId,
    boardId,
    level,
    nodes: semanticNodes,
    relations
  })

  useEffect(() => {
    latestPropsRef.current = {
      projectId,
      boardId,
      level,
      nodes: semanticNodes,
      relations
    }
  }, [projectId, boardId, level, semanticNodes, relations])

  useEffect(() => {
    onNodeContextMenuRef.current = onNodeContextMenu
  }, [onNodeContextMenu])

  const handleNodeContextMenu = useCallback((nodeId: string, screenX: number, screenY: number) => {
    onNodeContextMenuRef.current?.(nodeId, screenX, screenY)
  }, [])

  const mapNodes = useCallback(
    (nodeList: SemanticNode[]) =>
      toRFNodes(nodeList, { onNodeContextMenu: handleNodeContextMenu }) as Node[],
    [handleNodeContextMenu]
  )

  const initialNodes = useMemo(() => mapNodes(semanticNodes), [])
  const initialEdges = useMemo(() => {
    const nodeById = new Map(semanticNodes.map((n) => [n.id, n]))
    return toRFEdges(relations, nodeById) as Edge[]
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const latestCanvasStateRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: initialNodes,
    edges: initialEdges
  })
  const pendingExpectedSnapshotRef = useRef<DomainSyncSnapshot | null>(null)
  const pendingDomainSyncRef = useRef(false)
  const isDraggingRef = useRef(false)
  const hasDeferredDomainSyncRef = useRef(false)
  const syncFrameRef = useRef<number | null>(null)
  const latestDomainStateRef = useRef({ nodes: semanticNodes, relations })

  useEffect(() => {
    latestCanvasStateRef.current = { nodes, edges }
  }, [nodes, edges])

  const runDomainSync = useCallback(() => {
    const { nodes: currentNodes, relations: currentRelations } = latestDomainStateRef.current
    const nodeById = new Map(currentNodes.map((n) => [n.id, n]))
    const rfNodes = mapNodes(currentNodes)
    const rfEdges = toRFEdges(currentRelations, nodeById) as Edge[]

    setNodes((currentNodes) => {
      const selectedIds = new Set(currentNodes.filter((n) => n.selected).map((n) => n.id))
      return rfNodes.map((n) => ({ ...n, selected: selectedIds.has(n.id) }))
    })
    setEdges(rfEdges)
  }, [mapNodes, setEdges, setNodes])

  const attemptDomainSync = useCallback(() => {
    if (isDraggingRef.current) {
      hasDeferredDomainSyncRef.current = true
      return
    }

    const latest = latestPropsRef.current
    const currentBoardIdentity = `${latest.projectId}:${latest.boardId}`
    const skipDecision = resolveDomainSyncSkip(
      pendingExpectedSnapshotRef.current,
      currentBoardIdentity,
      latest.nodes,
      latest.relations
    )
    pendingExpectedSnapshotRef.current = skipDecision.nextPendingSnapshot
    if (skipDecision.shouldSkip) {
      return
    }

    if (isApplyingDomainRef.current) {
      if (pendingDomainSyncRef.current) return

      pendingDomainSyncRef.current = true
      syncFrameRef.current = requestAnimationFrame(() => {
        syncFrameRef.current = null
        pendingDomainSyncRef.current = false
        if (isApplyingDomainRef.current) {
          attemptDomainSync()
          return
        }
        runDomainSync()
      })
      return
    }

    runDomainSync()
  }, [runDomainSync])

  useEffect(() => {
    latestDomainStateRef.current = { nodes: semanticNodes, relations }
    attemptDomainSync()
  }, [semanticNodes, relations, attemptDomainSync])

  useEffect(() => {
    return () => {
      pendingExpectedSnapshotRef.current = null
      hasDeferredDomainSyncRef.current = false
      isDraggingRef.current = false
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current)
        syncFrameRef.current = null
        pendingDomainSyncRef.current = false
      }
    }
  }, [])

  const emitCanvasChange = useCallback(() => {
    if (isApplyingDomainRef.current) return

    const latest = latestPropsRef.current
    const latestBoardIdentity = `${latest.projectId}:${latest.boardId}`
    if (latestBoardIdentity !== mountedBoardIdentity.current) return

    isApplyingDomainRef.current = true
    try {
      const { nodes: currentNodes, edges: currentEdges } = latestCanvasStateRef.current
      const mapped = fromRFChanges(currentNodes, currentEdges, {
        projectId: latest.projectId,
        boardId: latest.boardId,
        level: latest.level,
        existingNodes: latest.nodes,
        existingRelations: latest.relations
      })

      const applied = onCanvasChange(latest.boardId, mapped.nodes, mapped.relations)
      if (applied === true) {
        pendingExpectedSnapshotRef.current = createDomainSyncSnapshot(
          latestBoardIdentity,
          mapped.nodes,
          mapped.relations
        )
      }
    } finally {
      isApplyingDomainRef.current = false
    }
  }, [onCanvasChange])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)

      if (isApplyingDomainRef.current) return

      const positionChanges = changes.filter(
        (change): change is NodeChange & { type: 'position'; dragging?: boolean } =>
          change.type === 'position'
      )
      const hasDraggingPositionChange = positionChanges.some((change) => change.dragging === true)
      const hasDragEndChange = positionChanges.some((change) => change.dragging !== true)

      if (hasDraggingPositionChange) {
        isDraggingRef.current = true
      }

      if (hasDragEndChange) {
        isDraggingRef.current = false
      }

      const latest = latestPropsRef.current
      const latestBoardIdentity = `${latest.projectId}:${latest.boardId}`
      if (latestBoardIdentity !== mountedBoardIdentity.current) return

      const hasRelevantChanges = changes.some(
        (change) => change.type === 'dimensions' || change.type === 'remove'
      )
      const shouldEmitCanvasChange = hasRelevantChanges || hasDragEndChange

      if (!shouldEmitCanvasChange) return

      requestAnimationFrame(() => {
        emitCanvasChange()
        if (hasDeferredDomainSyncRef.current) {
          hasDeferredDomainSyncRef.current = false
          attemptDomainSync()
        }
      })
    },
    [onNodesChange, emitCanvasChange, attemptDomainSync]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)

      if (isApplyingDomainRef.current) return

      const latest = latestPropsRef.current
      const latestBoardIdentity = `${latest.projectId}:${latest.boardId}`
      if (latestBoardIdentity !== mountedBoardIdentity.current) return

      const hasRelevantChanges = changes.some((change) => change.type === 'remove')
      if (!hasRelevantChanges) return

      requestAnimationFrame(() => {
        emitCanvasChange()
      })
    },
    [onEdgesChange, emitCanvasChange]
  )

  return {
    nodes,
    edges,
    setNodes,
    handleNodesChange,
    handleEdgesChange
  }
}
