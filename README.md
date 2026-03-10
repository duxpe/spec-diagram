# System Designer Specs Generator (MVP setup)

Bootstrap implementation for `spec 01` using Vite + React + TypeScript, Zustand, Dexie, Zod and tldraw.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Implemented in this stage

- Workspace creation with automatic root board (`N1`)
- Board page with tldraw rendered and semantic overlay nodes
- Semantic nodes and relations persisted locally (Dexie)
- Drill-down board navigation (`N1 -> N2 -> N3`)
- Autosave + `Ctrl+S`
- Export/import workspace JSON with Zod validation
- Unit tests baseline (Vitest + RTL)
