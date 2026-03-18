import JSZip from 'jszip'
import type { PromptExportBundle } from '@/domain/models/export'
import { MISSING_TEXT, toSlug } from '@/features/transfer/model/prompt-export-service/formatting'

export function renderPromptBundleIndex(bundle: PromptExportBundle): string {
  const lines = [
    '# Prompt Export Bundle',
    '',
    `- Project: ${bundle.projectName}`,
    `- Project ID: ${bundle.projectId}`,
    `- Export type: ${bundle.exportType}`,
    `- Exported at: ${bundle.exportedAt}`,
    `- Prompt count: ${bundle.items.length}`,
    '',
    '## Files'
  ]

  if (bundle.items.length === 0) {
    lines.push(`- ${MISSING_TEXT}`)
  } else {
    for (const item of bundle.items) {
      lines.push(`- ${item.filename} (${item.rootNodeType}: ${item.rootNodeTitle})`)
    }
  }

  return lines.join('\n')
}

export async function createPromptZipBytes(bundle: PromptExportBundle): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('index.md', renderPromptBundleIndex(bundle))

  for (const item of bundle.items) {
    zip.file(item.filename, item.markdown)
  }

  return zip.generateAsync({ type: 'uint8array' })
}

export async function createPromptZipBlob(bundle: PromptExportBundle): Promise<Blob> {
  const zipBytes = await createPromptZipBytes(bundle)
  const zipBuffer = zipBytes.buffer.slice(
    zipBytes.byteOffset,
    zipBytes.byteOffset + zipBytes.byteLength
  ) as ArrayBuffer
  return new Blob([zipBuffer], { type: 'application/zip' })
}

export function buildPromptZipFileName(bundle: PromptExportBundle): string {
  const dateToken = bundle.exportedAt.replace(/[:.]/g, '-')
  return `${toSlug(bundle.projectName)}-${bundle.exportType}-${dateToken}.zip`
}
