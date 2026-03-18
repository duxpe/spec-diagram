import { ZodError } from 'zod'

export function formatValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]
    if (!firstIssue) return 'Validation failed'

    const path = firstIssue.path.join('.')
    if (!path) return firstIssue.message
    return `${path}: ${firstIssue.message}`
  }

  if (error instanceof Error) return error.message
  return 'Validation failed'
}
