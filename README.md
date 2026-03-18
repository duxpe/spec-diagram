# SpecDiagram

Draw Diagrams and export as Specifications for AI Assisted Code Development.

## Prerequisites

- Node.js 20+
- npm 10+

## Commands

- `npm install`
- `npm run dev`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Definitive Source Structure

```text
src/
  app/
    App.tsx
    providers/
    router/
  features/
    project/
      model/        # project state and lifecycle
      ui/           # project listing and project setup/edit UI
    board/
      model/        # board state, ui state, autosave
      ui/           # board page + board-specific UI components
      canvas/       # reactflow adapters, nodes, edges, canvas tests
    transfer/
      model/        # import/export and prompt bundle orchestration
      ui/           # import/export UI
  domain/
    models/         # core business types
    schemas/        # zod schemas/validation
    semantics/      # allowed node/relation rules, palettes, meaning capture
    services/       # domain services not tied to UI framework
  infrastructure/
    db/
      dexie.ts
      repositories/
  shared/
    ui/             # shared reusable UI primitives
    lib/            # generic helpers (ids, dates, json, logger, icons)
    styles/         # global styles
    test/           # test setup
  main.tsx
```

## Architecture Rules

- Use `project` terminology everywhere in code and docs.
- Route model stays `/project/:projectId/board/:boardId`.
- Board model is `N1 -> N2` only.
- `N3` is not a board level; it is represented as internals tables attached to N2 node data.
- `method` and `attribute` are not semantic node types.
- Feature logic belongs under `src/features/*`; shared-only code goes to `src/shared/*`.
- Persistence code belongs only under `src/infrastructure/db/*`.
- Domain types/rules stay under `src/domain/*`.

## Testing and Validation Rules

Before merging any change, run:

1. `npm test`
2. `npm run typecheck`

## Persistence and Transfer Notes

- The local Dexie database uses a project-first schema and a new DB name (`designer-database-project-v1`), which intentionally resets old local data.
- JSON import/export is project-only and validated against the `2.0.0` export schema.
