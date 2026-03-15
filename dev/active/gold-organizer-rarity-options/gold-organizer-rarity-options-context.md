# gold-organizer-rarity-options Context
Last Updated: 2026-03-15

## Current State
- Gold organizer now supports rarity highlighting and optional rarity annotations in its BBCode output.
- Gold rarity calculations include pre-evo cumulative totals and the level 4 override path for unevolved level 4 golds.

## Decisions
- Reuse the ungendered sorter rarity thresholds and annotation suffixes for gold output.
- Fetch local reference data (`/data/pokemon_evolution.json`, `/data/level4_rarity.txt`) at runtime instead of duplicating static datasets under `src/data`.

## Blockers
- Local shell `PATH` did not expose Node/npm, and the installed Rollup optional native package was missing.
- Verification was run successfully by invoking npm under `node@22.22.0` via `npx` and repairing the missing Rollup optional dependency locally.

## Next Step
- Hand off the implemented change with verification results and the local environment note.

## Update (2026-03-15 00:17 PDT)
- Status: Mapped ungendered rarity behavior to gold organizer; lv4 gold counts are available in public/data/level4_rarity.txt.
- Decision: Implement rarity highlighting/annotation in gold organizer using cumulative gold rarity across evo chains plus lv4 override for level 4 golds.
- Next: Patch gold organizer UI/core and extend tests for highlight, annotation, and lv4 handling.

## Update (2026-03-15 00:27 PDT)
- Status: Gold organizer rarity options implemented and verified with `codex:quick` and `codex:verify`.
- Decision: Keep missing-list behavior unchanged; apply rarity highlighting/annotation to owned gold output and dropped-dupe output only.
- Blocker: Repo verification required a local Node 22 shim because the shell defaulted to Node 21 and lacked Node on `PATH`.
- Next: Summarize the shipped change and the environment workaround in the handoff.
