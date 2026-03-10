import { useEffect, useRef } from 'react'
import { TLShape, TLShapePartial, Tldraw } from 'tldraw'
import {
  fromTlChanges,
  getSemanticNodeIdFromShape,
  isSemanticShape,
  toTlRecords
} from '@/board/tldraw/semantic-adapter'
import { SemanticLevel } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import 'tldraw/tldraw.css'

interface TLComponentsProps {
  persistenceKey: string
  workspaceId: string
  boardId: string
  level: SemanticLevel
  nodes: SemanticNode[]
  relations: Relation[]
  selectedNodeId?: string
  onSelectNode: (nodeId?: string) => void
  onCanvasChange: (boardId: string, nodes: SemanticNode[], relations: Relation[]) => void
}

interface CanvasEditor {
  run: (fn: () => void) => void
  getCurrentPageShapes: () => TLShape[]
  createShapes: (shapes: unknown[]) => void
  updateShapes: (shapes: unknown[]) => void
  deleteShapes: (shapeIds: string[]) => void
  setSelectedShapes: (shapeIds: string[]) => void
  getOnlySelectedShapeId: () => string | null
  sideEffects: {
    registerBeforeCreateHandler: (
      typeName: 'shape',
      handler: (shape: TLShape, source: 'user' | 'remote') => TLShape | false
    ) => () => void
  }
  store: {
    listen: (
      onHistory: () => void,
      filters: { source: 'all' | 'user' | 'remote'; scope: 'all' | 'document' | 'session' }
    ) => () => void
  }
}

const FLOAT_TOLERANCE = 0.05

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumberClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= FLOAT_TOLERANCE
}

function isSubsetEqual(current: unknown, desired: unknown): boolean {
  if (typeof desired === 'number') {
    return typeof current === 'number' && isNumberClose(current, desired)
  }

  if (desired === null || desired === undefined) {
    return current === desired
  }

  if (Array.isArray(desired)) {
    if (!Array.isArray(current) || current.length !== desired.length) return false
    return desired.every((value, index) => isSubsetEqual(current[index], value))
  }

  if (isRecord(desired)) {
    if (!isRecord(current)) return false
    return Object.entries(desired).every(([key, value]) => isSubsetEqual(current[key], value))
  }

  return current === desired
}

function isShapeInSync(current: TLShape, desired: TLShapePartial): boolean {
  if (current.id !== desired.id || current.type !== desired.type) return false

  if (typeof desired.x === 'number' && !isNumberClose(current.x, desired.x)) return false
  if (typeof desired.y === 'number' && !isNumberClose(current.y, desired.y)) return false

  if (!isSubsetEqual(current.meta, desired.meta)) return false
  if (!isSubsetEqual(current.props, desired.props)) return false

  return true
}

export function TLComponents({
  persistenceKey,
  workspaceId,
  boardId,
  level,
  nodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onCanvasChange
}: TLComponentsProps): JSX.Element {
  const editorRef = useRef<CanvasEditor | null>(null)
  const isApplyingDomainRef = useRef(false)
  const latestPropsRef = useRef({
    workspaceId,
    boardId,
    level,
    nodes,
    relations
  })

  useEffect(() => {
    latestPropsRef.current = {
      workspaceId,
      boardId,
      level,
      nodes,
      relations
    }
  }, [workspaceId, boardId, level, nodes, relations])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const desiredShapes = toTlRecords(nodes, relations)
    const desiredById = new Map(desiredShapes.map((shape) => [shape.id, shape]))
    const currentShapes = editor.getCurrentPageShapes()

    const currentSemanticShapes = currentShapes.filter((shape) => isSemanticShape(shape))
    const currentNonSemanticShapeIds = currentShapes
      .filter((shape) => !isSemanticShape(shape))
      .map((shape) => shape.id)

    const currentSemanticIds = new Set(currentSemanticShapes.map((shape) => shape.id))
    const desiredIds = new Set(desiredShapes.map((shape) => shape.id))

    const toDelete = [
      ...currentSemanticShapes
        .filter((shape) => !desiredIds.has(shape.id))
        .map((shape) => shape.id),
      ...currentNonSemanticShapeIds
    ]

    const toCreate = desiredShapes.filter((shape) => !currentSemanticIds.has(shape.id))
    const toUpdate = currentSemanticShapes.reduce<TLShapePartial[]>((shapesToUpdate, shape) => {
      const desiredShape = desiredById.get(shape.id)
      if (!desiredShape) return shapesToUpdate
      if (isShapeInSync(shape, desiredShape)) return shapesToUpdate

      shapesToUpdate.push(desiredShape)
      return shapesToUpdate
    }, [])

    if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
      return
    }

    isApplyingDomainRef.current = true
    editor.run(() => {
      if (toDelete.length > 0) {
        editor.deleteShapes(toDelete)
      }

      if (toCreate.length > 0) {
        editor.createShapes(toCreate)
      }

      if (toUpdate.length > 0) {
        editor.updateShapes(toUpdate)
      }
    })
    isApplyingDomainRef.current = false
  }, [nodes, relations])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (!selectedNodeId) {
      editor.setSelectedShapes([])
      return
    }

    const selectedShape = editor
      .getCurrentPageShapes()
      .find((shape) => getSemanticNodeIdFromShape(shape) === selectedNodeId)

    if (!selectedShape) return

    editor.setSelectedShapes([selectedShape.id])
  }, [selectedNodeId])

  const handleMount = (editor: unknown): (() => void) => {
    const canvasEditor = editor as CanvasEditor
    editorRef.current = canvasEditor
    const mountedBoardIdentity = `${workspaceId}:${boardId}`

    const removeCreateGuard = canvasEditor.sideEffects.registerBeforeCreateHandler(
      'shape',
      (shape, source) => {
        if (source !== 'user') return shape
        if (isApplyingDomainRef.current) return shape
        if (isSemanticShape(shape as unknown as TLShape)) return shape
        return false
      }
    )

    const removeSelectionListener = canvasEditor.store.listen(
      () => {
        const selectedShapeId = canvasEditor.getOnlySelectedShapeId()
        const selectedShape = canvasEditor
          .getCurrentPageShapes()
          .find((shape) => shape.id === selectedShapeId)

        onSelectNode(getSemanticNodeIdFromShape(selectedShape as TLShape | undefined))
      },
      { source: 'all', scope: 'session' }
    )

    const removeUserListener = canvasEditor.store.listen(
      () => {
        if (isApplyingDomainRef.current) return

        const latest = latestPropsRef.current
        const latestBoardIdentity = `${latest.workspaceId}:${latest.boardId}`
        if (latestBoardIdentity !== mountedBoardIdentity) return

        const pageShapes = canvasEditor.getCurrentPageShapes()
        const mapped = fromTlChanges(pageShapes, {
          workspaceId: latest.workspaceId,
          boardId: latest.boardId,
          level: latest.level,
          existingNodes: latest.nodes,
          existingRelations: latest.relations
        })

        onCanvasChange(latest.boardId, mapped.nodes, mapped.relations)
      },
      { source: 'user', scope: 'document' }
    )

    return () => {
      removeCreateGuard()
      removeSelectionListener()
      removeUserListener()
      editorRef.current = null
    }
  }

  return (
    <div className="tldraw-host" aria-label="Board whiteboard">
      <Tldraw persistenceKey={persistenceKey} hideUi onMount={handleMount} />
    </div>
  )
}
