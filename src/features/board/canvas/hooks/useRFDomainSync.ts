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

  const handleNodeContextMenu = useCallback(
    (nodeId: string, screenX: number, screenY: number) => {
      if (!onNodeContextMenu) return
      onNodeContextMenu(nodeId, screenX, screenY)
    },
    [onNodeContextMenu]
  )

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
  const skipDomainSyncRef = useRef(false)
  const pendingDomainSyncRef = useRef(false)
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
    if (skipDomainSyncRef.current) {
      skipDomainSyncRef.current = false
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
    attemptDomainSync()
    return () => {
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current)
        syncFrameRef.current = null
        pendingDomainSyncRef.current = false
      }
    }
  }, [attemptDomainSync])

  useEffect(() => {
    latestDomainStateRef.current = { nodes: semanticNodes, relations }
    attemptDomainSync()
  }, [semanticNodes, relations, attemptDomainSync])

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
        skipDomainSyncRef.current = true
      }
    } finally {
      isApplyingDomainRef.current = false
    }
  }, [onCanvasChange])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)

      if (isApplyingDomainRef.current) return

      const latest = latestPropsRef.current
      const latestBoardIdentity = `${latest.projectId}:${latest.boardId}`
      if (latestBoardIdentity !== mountedBoardIdentity.current) return

      const hasRelevantChanges = changes.some(
        (change) => change.type === 'position' || change.type === 'dimensions' || change.type === 'remove'
      )

      if (!hasRelevantChanges) return

      requestAnimationFrame(() => {
        emitCanvasChange()
      })
    },
    [onNodesChange, emitCanvasChange]
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
