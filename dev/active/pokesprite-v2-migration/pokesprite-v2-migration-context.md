# pokesprite-v2-migration Context
Last Updated: 2026-03-12

## Current State
-

## Decisions
-

## Blockers
-

## Next Step
-

## Update (2026-03-12 03:16 PDT)
- Status: Bootstrapped task state and inferred GitHub owner from current repo config.
- Decision: Use darknesspwnsu as <owner> and create a sibling repo at ../pokesprite-v2.
- Next: Clone upstream pokesprite and scaffold successor repo build pipeline.

## Update (2026-03-12 03:56 PDT)
- Status: Implemented the tppc-tools migration, copied the local manifest snapshot, and passed codex:quick plus codex:verify.
- Decision: Use a checked-in local vendor manifest for runtime fetches while pinning sprite URLs and the sync script to the v0.1.0 pokesprite-v2 release.
- Blocker: GitHub is still not surfacing the initial main branch push for ../pokesprite-v2, so the remote tag/pages publish step is pending transport completion.
- Next: Finish publishing pokesprite-v2 (main branch, v0.1.0 tag, Pages deploy) and rerun npm run sync:pokesprite-data against the live tag.
