# gold-organizer-rarity-options Plan
Last Updated: 2026-03-15

## Summary
- Add ungendered-sorter style rarity controls to the gold organizer.
- Compute cumulative gold rarity across pre-evo chains.
- Apply level 4 rarity overrides for level 4 unevolved golds.

## Implementation Changes
- Extend gold organizer prefs and UI with `highlightRarity` and `annotateRarity`.
- Load `pokemon_evolution.json` and `level4_rarity.txt` on demand in the client and build reusable reference data.
- Enrich gold organizer output formatting with rarity highlighting and optional annotations.
- Add unit coverage for cumulative gold rarity and level 4 gold override behavior.
- Extend the gold organizer tool ID contract for the new controls.

## Acceptance Criteria
- Gold organizer exposes highlight and annotate rarity options.
- Level 4 gold entries use level 4 rarity counts when the exact unevolved gold exists in the level 4 list.
- `npm run codex:quick` passes.
- `npm run codex:verify` passes.
