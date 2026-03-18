import { describe, expect, it } from 'vitest'
import type { Node, Edge } from '@xyflow/react'
import {
  toRFNodes,
  toRFEdges,
  fromRFChanges,
  isNodeEquivalent,
  isRelationEquivalent,
  type RFNodeData,
  type RFEdgeData
} from '@/features/board/canvas/reactflow-adapter'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'

const now = new Date().toISOString()

function buildNode(id: string, title: string, x = 10, y = 20): SemanticNode {
  return {
    id,
    projectId: 'ws_1',
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
    projectId: 'ws_1',
    boardId: 'board_1',
    sourceNodeId,
    targetNodeId,
    type: 'depends_on',
    createdAt: now,
    updatedAt: now
  }
}

describe('reactflow-adapter', () => {
  describe('toRFNodes', () => {
    it('maps visual defaults and appearance overrides into React Flow nodes', () => {
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

      const rfNodes = toRFNodes([databaseNode, customNode])

      const databaseRfNode = rfNodes.find((n) => n.id === 'node_db')
      const customRfNode = rfNodes.find((n) => n.id === 'node_custom')

      expect(databaseRfNode?.type).toBe('semantic-node')
      expect(databaseRfNode?.data).toMatchObject({
        shapeVariant: 'cylinder',
        provider: 'none',
        icon: 'database',
        accentColor: 'amber'
      })

      expect(customRfNode?.type).toBe('semantic-node')
      expect(customRfNode?.data).toMatchObject({
        shapeVariant: 'hexagon',
        provider: 'aws',
        accentColor: 'purple',
        hasChildBoard: true
      })
    })

    it('sets correct position and dimensions', () => {
      const node = buildNode('node_a', 'Node A', 100, 200)
      node.width = 250
      node.height = 150

      const rfNodes = toRFNodes([node])

      expect(rfNodes[0]!.position).toEqual({ x: 100, y: 200 })
      expect(rfNodes[0]!.width).toBe(250)
      expect(rfNodes[0]!.height).toBe(150)
    })
  })

  describe('toRFEdges', () => {
    it('maps relations to React Flow edges', () => {
      const nodeA = buildNode('node_a', 'Node A')
      const nodeB = buildNode('node_b', 'Node B', 300, 20)
      const relation = buildRelation('rel_ab', 'node_a', 'node_b')
      relation.label = 'depends'

      const nodeById = new Map([
        [nodeA.id, nodeA],
        [nodeB.id, nodeB]
      ])

      const rfEdges = toRFEdges([relation], nodeById)

      expect(rfEdges).toHaveLength(1)
      expect(rfEdges[0]).toMatchObject({
        id: 'rel_ab',
        type: 'relation',
        source: 'node_a',
        target: 'node_b',
        label: 'depends'
      })
      expect(rfEdges[0]!.data).toMatchObject({
        semanticId: 'rel_ab',
        relationType: 'depends_on',
        label: 'depends'
      })
    })

    it('filters out relations with missing endpoints', () => {
      const nodeA = buildNode('node_a', 'Node A')
      const relation = buildRelation('rel_ab', 'node_a', 'node_missing')

      const nodeById = new Map([[nodeA.id, nodeA]])
      const rfEdges = toRFEdges([relation], nodeById)

      expect(rfEdges).toHaveLength(0)
    })
  })

  describe('fromRFChanges', () => {
    it('preserves unchanged semantic objects when mapping from canvas', () => {
      const nodeA = buildNode('node_a', 'Node A', 20, 30)
      const nodeB = buildNode('node_b', 'Node B', 320, 80)
      const relation = buildRelation('rel_ab', 'node_a', 'node_b')

      const rfNodes = toRFNodes([nodeA, nodeB])
      const nodeById = new Map([
        [nodeA.id, nodeA],
        [nodeB.id, nodeB]
      ])
      const rfEdges = toRFEdges([relation], nodeById)

      const mapped = fromRFChanges(rfNodes, rfEdges, {
        projectId: 'ws_1',
        boardId: 'board_1',
        level: 'N1',
        existingNodes: [nodeA, nodeB],
        existingRelations: [relation]
      })

      // Object identity should be preserved
      expect(mapped.nodes.find((node) => node.id === nodeA.id)).toBe(nodeA)
      expect(mapped.nodes.find((node) => node.id === nodeB.id)).toBe(nodeB)
      expect(mapped.relations.find((item) => item.id === relation.id)).toBe(relation)
    })

    it('maps React Flow nodes back to semantic domain state', () => {
      const existingNode = buildNode('node_a', 'Old title')
      const existingRelation = buildRelation('rel_ab', 'node_a', 'node_b')

      const rfNodes: Node<RFNodeData>[] = [
        {
          id: 'node_a',
          type: 'semantic-node',
          position: { x: 140, y: 90 },
          width: 260,
          height: 140,
          data: {
            semanticId: 'node_a',
            semanticType: 'container_service',
            title: 'Updated title',
            shapeVariant: 'rectangle',
            icon: 'cube',
            accentColor: 'teal',
            provider: 'none',
            showProviderBadge: false,
            hasChildBoard: false,
            hasValidationErrors: false,
            width: 260,
            height: 140
          }
        },
        {
          id: 'node_b',
          type: 'semantic-node',
          position: { x: 420, y: 110 },
          width: 220,
          height: 120,
          data: {
            semanticId: 'node_b',
            semanticType: 'database',
            title: 'Node B',
            shapeVariant: 'cylinder',
            icon: 'database',
            accentColor: 'amber',
            provider: 'none',
            showProviderBadge: false,
            hasChildBoard: false,
            hasValidationErrors: false,
            width: 220,
            height: 120
          }
        }
      ]

      const rfEdges: Edge<RFEdgeData>[] = [
        {
          id: 'rel_ab',
          type: 'relation',
          source: 'node_a',
          target: 'node_b',
          data: {
            semanticId: 'rel_ab',
            relationType: 'depends_on',
            label: 'depends'
          }
        }
      ]

      const mapped = fromRFChanges(rfNodes, rfEdges, {
        projectId: 'ws_1',
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

  describe('equivalence checks', () => {
    it('isNodeEquivalent returns true for identical nodes', () => {
      const node = buildNode('node_a', 'Node A')
      expect(isNodeEquivalent(node, { ...node })).toBe(true)
    })

    it('isNodeEquivalent returns false for different positions', () => {
      const node = buildNode('node_a', 'Node A', 10, 20)
      const moved = { ...node, x: 100 }
      expect(isNodeEquivalent(node, moved)).toBe(false)
    })

    it('isNodeEquivalent handles float tolerance', () => {
      const node = buildNode('node_a', 'Node A', 10, 20)
      const slightlyMoved = { ...node, x: 10.04 }
      expect(isNodeEquivalent(node, slightlyMoved)).toBe(true)
    })

    it('isRelationEquivalent returns true for identical relations', () => {
      const relation = buildRelation('rel_ab', 'node_a', 'node_b')
      expect(isRelationEquivalent(relation, { ...relation })).toBe(true)
    })

    it('isRelationEquivalent returns false for different endpoints', () => {
      const relation = buildRelation('rel_ab', 'node_a', 'node_b')
      const changed = { ...relation, targetNodeId: 'node_c' }
      expect(isRelationEquivalent(relation, changed)).toBe(false)
    })
  })
})
