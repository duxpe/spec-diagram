const UI_LOGGING_ENABLED = import.meta.env.VITE_UI_LOGS_ENABLED === 'true'

export function isUiLoggingEnabled(): boolean {
  return UI_LOGGING_ENABLED
}

export function logUiEvent(message: string, payload?: Record<string, unknown>): void {
  if (!UI_LOGGING_ENABLED) return
  if (payload && Object.keys(payload).length > 0) {
    console.log(`[UI LOG] ${message}`, payload)
    return
  }
  console.log(`[UI LOG] ${message}`)
}
