import { describe, expect, it } from 'vitest'
import { TLShape } from 'tldraw'
import { fromTlChanges, getNodeShapeId, getRelationShapeId, toTlRecords } from '@/board/tldraw/semantic-adapter'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'

const now = new Date().toISOString()

function buildNode(id: string, title: string, x = 10, y = 20): SemanticNode {
  return {
    id,
    workspaceId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'system',
    title,
    x,
    y,
    width: 200,
    height: 120,
    data: {},
    createdAt: now,
    updatedAt: now
  }
}

function buildRelation(id: string, sourceNodeId: string, targetNodeId: string): Relation {
  return {
    id,
    workspaceId: 'ws_1',
    boardId: 'board_1',
    sourceNodeId,
    targetNodeId,
    type: 'depends_on',
    createdAt: now,
    updatedAt: now
  }
}

function getAbsoluteArrowEndpoints(shape: Record<string, unknown>): {
  startX: number
  startY: number
  endX: number
  endY: number
} {
  const props = shape.props as {
    start: { x: number; y: number }
    end: { x: number; y: number }
  }

  return {
    startX: Number(shape.x) + props.start.x,
    startY: Number(shape.y) + props.start.y,
    endX: Number(shape.x) + props.end.x,
    endY: Number(shape.y) + props.end.y
  }
}

describe('semantic-adapter', () => {
  it('anchors relation arrow endpoints on node edges, not centers', () => {
    const source = buildNode('node_a', 'Node A', 0, 0)
    const target = buildNode('node_b', 'Node B', 400, 0)
    const relation = buildRelation('rel_ab', 'node_a', 'node_b')

    const records = toTlRecords([source, target], [relation])
    const relationShape = records.find(
      (shape) => shape.id === getRelationShapeId(relation.id) && shape.type === 'arrow'
    ) as Record<string, unknown>

    expect(relationShape).toBeDefined()

    const endpoints = getAbsoluteArrowEndpoints(relationShape)

    expect(endpoints.startX).toBe(208)
    expect(endpoints.startY).toBe(60)
    expect(endpoints.endX).toBe(392)
    expect(endpoints.endY).toBe(60)

    expect(endpoints.startX).not.toBe(source.x + source.width / 2)
    expect(endpoints.endX).not.toBe(target.x + target.width / 2)
  })

  it('maps visual defaults and appearance overrides into tldraw semantic-node shapes', () => {
    const databaseNode: SemanticNode = {
      ...buildNode('node_db', 'Database'),
      type: 'database'
    }
    const customNode: SemanticNode = {
      ...buildNode('node_custom', 'Custom Service', 280, 40),
      type: 'container_service',
      childBoardId: 'board_child_1',
      data: {
        responsibility: 'Process requests'
      },
      appearance: {
        shapeVariant: 'hexagon',
        accentColor: 'purple',
        provider: 'aws'
      }
    }

    const records = toTlRecords([databaseNode, customNode], [])
    const databaseShape = records.find((shape) => shape.id === getNodeShapeId(databaseNode.id))
    const customShape = records.find((shape) => shape.id === getNodeShapeId(customNode.id))

    expect(databaseShape?.type).toBe('semantic-node')
    expect(databaseShape?.props).toMatchObject({
      shapeVariant: 'oval',
      color: 'yellow',
      provider: 'none',
      icon: 'database',
      accentColor: 'amber'
    })

    expect(customShape?.type).toBe('semantic-node')
    expect(customShape?.props).toMatchObject({
      shapeVariant: 'hexagon',
      color: 'light-violet',
      provider: 'aws',
      accentColor: 'purple',
      hasChildBoard: true
    })
  })

  it('preserves unchanged semantic objects when mapping from canvas', () => {
    const nodeA = buildNode('node_a', 'Node A', 20, 30)
    const nodeB = buildNode('node_b', 'Node B', 320, 80)
    const relation = buildRelation('rel_ab', 'node_a', 'node_b')

    const shapes = toTlRecords([nodeA, nodeB], [relation]) as TLShape[]
    const mapped = fromTlChanges(shapes, {
      workspaceId: 'ws_1',
      boardId: 'board_1',
      level: 'N1',
      existingNodes: [nodeA, nodeB],
      existingRelations: [relation]
    })

    expect(mapped.nodes.find((node) => node.id === nodeA.id)).toBe(nodeA)
    expect(mapped.nodes.find((node) => node.id === nodeB.id)).toBe(nodeB)
    expect(mapped.relations.find((item) => item.id === relation.id)).toBe(relation)
  })

  it('maps toldraw semantic shapes back to semantic domain state', () => {
    const existingNode = buildNode('node_a', 'Old title')
    const existingRelation = buildRelation('rel_ab', 'node_a', 'node_b')

    const tlShapes = [
      {
        id: getNodeShapeId('node_a'),
        type: 'semantic-node',
        x: 140,
        y: 90,
        props: {
          text: 'Updated title',
          w: 260,
          h: 140,
          semanticId: 'node_a',
          semanticType: 'container_service',
          shapeVariant: 'rectangle',
          icon: 'cube',
          color: 'light-blue',
          accentColor: 'teal',
          provider: 'none',
          showProviderBadge: false,
          hasChildBoard: false,
          hasValidationErrors: false
        }
      },
      {
        id: getNodeShapeId('node_b'),
        type: 'semantic-node',
        x: 420,
        y: 110,
        props: {
          text: 'Node B',
          w: 220,
          h: 120,
          semanticId: 'node_b',
          semanticType: 'database',
          shapeVariant: 'oval',
          icon: 'database',
          color: 'yellow',
          accentColor: 'amber',
          provider: 'none',
          showProviderBadge: false,
          hasChildBoard: false,
          hasValidationErrors: false
        }
      },
      {
        id: getRelationShapeId('rel_ab'),
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          text: 'depends'
        },
        meta: {
          semanticKind: 'relation',
          semanticId: 'rel_ab',
          sourceNodeId: 'node_a',
          targetNodeId: 'node_b',
          relationType: 'depends_on'
        }
      }
    ] as unknown as TLShape[]

    const mapped = fromTlChanges(tlShapes, {
      workspaceId: 'ws_1',
      boardId: 'board_1',
      level: 'N1',
      existingNodes: [existingNode],
      existingRelations: [existingRelation]
    })

    const updatedNode = mapped.nodes.find((node) => node.id === 'node_a')

    expect(updatedNode?.title).toBe('Updated title')
    expect(updatedNode?.x).toBe(140)
    expect(updatedNode?.width).toBe(260)
    expect(mapped.relations).toHaveLength(1)
    expect(mapped.relations[0]?.sourceNodeId).toBe('node_a')
    expect(mapped.relations[0]?.targetNodeId).toBe('node_b')
  })
})
