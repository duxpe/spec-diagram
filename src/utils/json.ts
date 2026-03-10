export function parseJson(input: string): unknown {
  return JSON.parse(input)
}

export function toPrettyJson(input: unknown): string {
  return JSON.stringify(input, null, 2)
}
