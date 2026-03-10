import { db } from '@/db/dexie'
import { ExportHistoryEntry } from '@/domain/models/export'

export const exportRepo = {
  async add(entry: ExportHistoryEntry): Promise<void> {
    await db.exports.put(entry)
  }
}
