# pokesprite-v2-migration Plan
Last Updated: 2026-03-12

## Summary
- Publish a forked `pokesprite-v2` successor repo with rerunnable build/docs workflows.
- Migrate the TPPC pokesprite generator to a pinned `pokesprite-v2` manifest and variant-aware resolver.

## Implementation Changes
- Add a local source config plus sync script for a pinned `pokesprite-v2` manifest snapshot.
- Replace the species-only resolver with manifest-driven shiny/form/mega resolution.
- Add `#shinyToggle` and `#formSelect` controls while preserving existing pokesprite generator IDs.
- Expand unit, parity, and e2e coverage for shiny, mega, alt-form, and Gen 9 renders.

## Acceptance Criteria
- `npm run codex:quick` passes.
- `npm run codex:verify` passes.
- The generator can render shiny, mega, alt-form, and Gen 9 sprites from the pinned `pokesprite-v2` data model.
- The remaining external follow-up is publishing the sibling `pokesprite-v2` repo/tag/pages so the raw sprite URLs resolve from GitHub.
