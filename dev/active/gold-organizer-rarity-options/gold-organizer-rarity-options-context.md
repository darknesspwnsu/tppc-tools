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

## Update (2026-03-15 00:35 PDT)
- Status: Investigating reported missing highlight for GoldenMantine ♀ 4.
- Decision: Reproduce the Mantine case against the gold organizer core and inspect cumulative rarity lookup for gendered level-4 golds.
- Next: Trace Mantine rarity/evolution data, patch the lookup bug, and rerun verification.

## Update (2026-03-15 00:45 PDT)
- Status: Patched gold organizer rarity lookup to use row-specific gender buckets plus level-4 fallbacks for exact-gold and bare-species hits.
- Decision: Prefer exact Golden lv4 matches first, then fall back to the bare species lv4 line when the gold entry is missing because the local lv4 dataset is inconsistent for golds.
- Next: Run focused unit coverage, then codex:quick and codex:verify before reporting back.

## Update (2026-03-15 00:48 PDT)
- Status: Tightened the lv4 override to exact Golden/form-inclusive matches only; bare-species lv4 rows no longer apply to gold entries.
- Decision: Keep level-4 gold rarity strict to exact match because level4_rarity.txt is a shared multi-variant list and base-species rows must not bleed into gold rows.
- Next: Re-run focused gold organizer tests, then codex:quick and codex:verify on the exact-match implementation.

## Update (2026-03-15 00:49 PDT)
- Status: Aligned the lv4 override with the ungendered-only source data: exact Golden/form-inclusive match plus ungendered rows only.
- Decision: Use the lv4 file only for ungendered gold rows because that dataset does not carry male/female counts; gendered rows stay on the main gold rarity table's bucket counts.
- Next: Run codex:quick and codex:verify on the corrected ungendered-only lv4 behavior.

## Update (2026-03-15 00:56 PDT)
- Status: Switched the gold organizer lv4 lookup to the same gender-inclusive JSON feed used by tppc-faqbot's !l4 command.
- Decision: Use exact-name entries from https://darknesspwnsu.github.io/tppc-data/data/l4_rarity.json so level-4 gold annotations can respect male/female/ungendered/genderless counts instead of the legacy text dump.
- Next: Run codex:quick and codex:verify on the FAQ-bot-aligned level-4 lookup implementation.

## Update (2026-03-15 01:00 PDT)
- Status: Implemented FAQ-bot-aligned lv4 lookup using the gender-inclusive l4_rarity.json feed and exact gold-name matching.
- Decision: Use the same level-4 data source and exact-name lookup pattern as tppc-faqbot's !l4 command; keep main rarity fallback when the exact level-4 entry is absent.
- Next: Report the implementation and note that typecheck, unit tests, and build passed while Playwright e2e/parity runs hung in this environment.

## Update (2026-03-15 01:01 PDT)
- Status: Expanded regression coverage for FAQ-bot-aligned gold lv4 rarity, including form-inclusive exact matching.
- Decision: Keep explicit tests for male, female, ungendered, exact-match-only, and form-inclusive exact-match behavior so future refactors cannot regress these lv4 lookup rules.
- Next: Report the added regression coverage and current verification status.

## Update (2026-03-15 01:01 PDT)
- Status: Investigating gender-aware rarity annotations and separate highlight thresholds for overall vs level-4 rarity.
- Decision: Validate the current GoldenLarvitar counts from the live l4 feed before changing annotation format so the output reflects the intended gender-specific rarity story.
- Next: Patch annotation formatting and threshold logic, then extend regression tests around gender-aware output.

## Update (2026-03-15 01:04 PDT)
- Status: Implemented gender-aware rarity annotation with separate highlight thresholds for overall vs exact level-4 gender rarity.
- Decision: Show exact level-4 gender rarity with overall gender context when both exist, annotate even for non-highlighted rows, and only visually highlight overall<50 or exact-l4<20.
- Next: Report the new annotation format, threshold behavior, and updated regression coverage.
