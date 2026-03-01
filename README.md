# TPPC Tools

Native Next.js static-export site for TPPC utility tools.

## Architecture (Native-Only)

- `app/tools/<slug>/page.tsx`
  - One native route per tool page.
- `src/components/tools/*.tsx`
  - Native React tool UIs.
- `src/features/<tool>/core.ts`
  - Pure tool logic used by UI and tests.
- `src/features/<tool>/types.ts`
  - Tool input/output contracts.
- `src/tools/registry.ts`
  - Canonical tool metadata:
    - `route`
    - `status`
- `src/tools/modules.ts`
  - Tool module contract:
    - `Component`
    - `parse`
    - `compute`
    - `serialize`
    - `initialState`
- `scripts/capture-parity-fixtures.ts`
  - Captures parity snapshots from native canonical routes.
- `tests/parity/`
  - Parity fixtures + scenario harness.
  - `tests/parity/contracts/tool-id-contracts.json` is the required control-ID contract for stable UI selectors.
- `tests/unit/`
  - Core logic and decommission assertions.
- `tests/e2e/`
  - Native route/integration coverage.

## Tool Metadata Contract

Each tool entry in `src/tools/registry.ts` must define:

- `route: "/tools/<slug>/"`
- `status: "active" | "beta" | "deprecated"`

## Add a New Native Tool

1. Create `src/features/<tool>/types.ts` and `src/features/<tool>/core.ts`.
2. Build UI in `src/components/tools/<ToolName>Tool.tsx`.
3. Add route in `app/tools/<slug>/page.tsx` with page `metadata`.
4. Add tool entry to `src/tools/registry.ts`.
5. Wire module in `src/tools/modules.ts`.
6. Add unit tests in `tests/unit/`.
7. Add parity scenario in `tests/parity/scenarios.ts` if parity coverage is required.

## Parity Fixture Refresh Workflow

1. Capture fixtures from native pages:
   - `npm run capture:parity-fixtures`
2. Run native parity checks:
   - `npm run test:parity:native`
3. Run base-path parity checks:
   - `npm run test:parity:basepath`
4. If fixture output changed intentionally, commit updates in `tests/parity/golden/*.json` with a short explanation in the commit message.

## Parity Contract Policy

1. Do not remove existing tool capabilities during native migration without a documented replacement.
2. Required parity control IDs are enforced by `tests/unit/tool-id-contracts.test.ts`.
3. If an ID must change, update:
   - `tests/parity/contracts/tool-id-contracts.json`
   - E2E/parity selectors
   - Migration notes in commit message
4. Default rule: parity-first, then polish.

## Commands

- `npm run dev`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:parity`
- `npm run test:parity:native`
- `npm run test:parity:basepath`
- `npm run test:ci`
- `npm run capture:parity-fixtures`

## Internal Dashboard

- `/internal/migration/` shows tool inventory metadata and module presence.
