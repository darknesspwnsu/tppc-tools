# TPPC Tools

Next.js static-export site for TPPC utility tools.

## Architecture

- `app/tools/[slug]/page.tsx`
  - Compatibility wrapper for tools still on legacy runtime HTML.
- `app/tools/<tool>/page.tsx`
  - Native tool routes (migrated tools).
- `src/tools/registry.ts`
  - Source of truth for tool metadata and rollout status.
- `src/tools/modules.ts`
  - Per-tool module contract (`Component`, `parse`, `compute`, `serialize`, `initialState`).
- `src/features/<tool>/`
  - Extracted pure logic modules for native tools and migration targets.
- `tests/parity/`
  - Snapshot parity checks against golden fixtures.

## Migration Metadata

Each tool in `src/tools/registry.ts` declares:

- `implementation`: `native` or `legacy`
- `route`: canonical route (`/tools/<slug>/`)
- `legacyRedirects`: old URLs that must continue to work
- `status`: rollout status

## Commands

- `npm run dev`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:parity`
- `npm run test:parity:native`
- `npm run test:parity:legacy`
- `npm run test:parity:basepath`
- `npm run test:ci`

## Internal Dashboard

- `/internal/migration/` shows migration status and metadata in-app.
