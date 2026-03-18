import type { PromptExportBundle, PromptExportItem } from '@/domain/models/export'
import { buildExportContexts } from '@/features/transfer/model/prompt-export-service/context-builder'
import { compareNodes, toSlug } from '@/features/transfer/model/prompt-export-service/formatting'
import { renderPromptMarkdown } from '@/features/transfer/model/prompt-export-service/markdown-renderer'
import type { PromptExportBuildInput } from '@/features/transfer/model/prompt-export-service/types'
import {
  buildPromptZipFileName,
  createPromptZipBlob,
  createPromptZipBytes
} from '@/features/transfer/model/prompt-export-service/zip-output'

export function buildPromptExportBundle(input: PromptExportBuildInput): PromptExportBundle {
  const exportedAt = input.exportedAt ?? new Date().toISOString()
  const contexts = buildExportContexts(input).sort((a, b) => compareNodes(a.rootNode, b.rootNode))
  const indexWidth = Math.max(2, String(contexts.length).length)

  const items: PromptExportItem[] = contexts.map((context, index) => {
    const prefix = String(index + 1).padStart(indexWidth, '0')
    const filename = `${prefix}-${toSlug(context.rootNode.title)}-${input.exportType}.md`

    return {
      rootNodeId: context.rootNode.id,
      rootNodeTitle: context.rootNode.title,
      rootNodeType: context.rootNode.type,
      filename,
      markdown: renderPromptMarkdown(context, input.exportType)
    }
  })

  return {
    projectId: input.project.id,
    projectName: input.project.name,
    exportType: input.exportType,
    exportedAt,
    items
  }
}

export { createPromptZipBytes, createPromptZipBlob, buildPromptZipFileName }
