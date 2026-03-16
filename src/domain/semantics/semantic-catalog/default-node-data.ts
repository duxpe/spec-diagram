import { SemanticLevel } from '@/domain/models/board'
import { SemanticNodeType } from '@/domain/models/semantic-node'

export function getDefaultNodeData(level: SemanticLevel, type: SemanticNodeType): Record<string, unknown> {
  if (level === 'N2') {
    switch (type) {
      case 'class':
        return {
          responsibility: 'Describe class responsibility',
          internals: {
            methods: [],
            attributes: []
          }
        }
      case 'interface':
        return {
          purpose: 'Describe interface purpose',
          internals: {
            methods: [],
            attributes: []
          }
        }
      case 'api_contract':
        return {
          kind: 'http',
          inputSummary: ['Describe contract input'],
          outputSummary: ['Describe contract output'],
          internals: {
            endpoints: []
          }
        }
      case 'free_note_input':
        return {
          expectedInputsText: 'Describe expected inputs'
        }
      case 'free_note_output':
        return {
          expectedOutputsText: 'Describe expected outputs'
        }
      default:
        return {}
    }
  }

  if (level !== 'N1') return {}

  switch (type) {
    case 'system':
      return {
        goal: 'Define the high-level business goal',
        primaryResponsibilities: ['Define primary responsibility']
      }
    case 'container_service':
      return {
        responsibility: 'Describe the main responsibility'
      }
    case 'database':
      return {
        purpose: 'Describe what this database stores',
        storageModel: 'relational'
      }
    case 'external_system':
      return {
        purpose: 'Describe why this external system exists',
        interactionType: 'unknown'
      }
    case 'port':
      return {
        direction: 'inbound',
        responsibility: 'Describe what this port is responsible for'
      }
    case 'adapter':
      return {
        responsibility: 'Describe what this adapter does'
      }
    case 'decision':
      return {
        decision: 'Describe the architectural decision',
        status: 'proposed'
      }
    case 'free_note_input':
      return {
        expectedInputsText: 'Describe expected inputs'
      }
    case 'free_note_output':
      return {
        expectedOutputsText: 'Describe expected outputs'
      }
    default:
      return {}
  }
}
