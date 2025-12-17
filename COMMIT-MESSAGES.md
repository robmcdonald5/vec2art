# Atomic Commit Messages

Each commit below represents a single logical change with specific files.

---

## Commit 1: Create documentation index

```
docs: add documentation index and navigation

Create docs/README.md as central navigation hub for all documentation.

Files:
  A docs/README.md
```

---

## Commit 2: Add getting-started documentation

```
docs: add getting-started guide

Create installation, quick-start, and browser support documentation.

Files:
  A docs/getting-started/installation.md
  A docs/getting-started/quick-start.md
  A docs/getting-started/browser-support.md
```

---

## Commit 3: Add algorithm documentation

```
docs: add algorithm reference documentation

Create overview and detailed docs for all four vectorization algorithms.

Files:
  A docs/algorithms/overview.md
  A docs/algorithms/edge-detection.md
  A docs/algorithms/dots-stippling.md
  A docs/algorithms/centerline.md
  A docs/algorithms/superpixel.md
```

---

## Commit 4: Add development documentation

```
docs: add development guide documentation

Create architecture, build, frontend, testing, and deployment guides.

Files:
  A docs/development/architecture.md
  A docs/development/wasm-build.md
  A docs/development/frontend-guide.md
  A docs/development/testing.md
  A docs/development/deployment.md
```

---

## Commit 5: Add reference documentation and contributing guide

```
docs: add reference documentation and contributing guide

Create complete parameter reference, API documentation, and contribution guidelines.

Files:
  A docs/reference/parameters.md
  A docs/reference/api.md
  A docs/contributing.md
```

---

## Commit 6: Rewrite root README

```
docs: rewrite README.md as focused overview

Condense from ~300 lines to ~90 lines. Remove emojis, add links to docs/.

Files:
  M README.md
```

---

## Commit 7: Fix CLAUDE.md typos and remove emojis

```
docs: fix CLAUDE.md typos and remove emojis

Root: fix "tran" typo, incomplete sentence, remove duplicate section.
Frontend: remove emojis from build status section.
WASM: remove emojis from status indicators and headers.

Files:
  M CLAUDE.md
  M frontend/CLAUDE.md
  M wasm/CLAUDE.md
```

---

## Commit 8: Update frontend and wasm READMEs

```
docs: update frontend and wasm READMEs with docs links

Simplify READMEs and add links to centralized documentation.

Files:
  M frontend/README.md
  M wasm/vectorize-wasm/README.md
```

---

## Commit 9: Delete root-level migrated docs

```
docs: delete migrated root-level documentation

Content moved to docs/development/ and docs/reference/.

Files:
  D CONFIG-REFACTOR-PLAN.md
  D DEPLOYMENT.md
  D WASM-REBUILD-README.md
```

---

## Commit 10: Delete frontend migrated docs

```
docs: delete migrated frontend documentation

Content moved to docs/development/testing.md, docs/development/frontend-guide.md,
and docs/algorithms/.

Files:
  D frontend/TESTING-GUIDE.md
  D frontend/STORYBOOK.md
  D frontend/docs/ALGORITHM_PARAMETERS.md
```

---

## Commit 11: Delete wasm/docs migrated files

```
docs: delete migrated wasm/docs documentation

Content distributed to docs/algorithms/, docs/development/, and docs/reference/.

Files:
  D wasm/docs/COMPREHENSIVE_TESTING_SUMMARY.md
  D wasm/docs/DOT_MAPPING_DEVELOPMENT.md
  D wasm/docs/RAYON_MIGRATION_STATUS.md
  D wasm/docs/SVELTEKIT_INTEGRATION.md
  D wasm/docs/SVG_DOTS_DEMO.md
  D wasm/docs/centerline_tracing_cleanup_playbook.md
  D wasm/docs/centerline_tracing_diagnostics_and_fixes.md
  D wasm/docs/dot_mapping_api.md
  D wasm/docs/dot_mapping_examples.md
  D wasm/docs/dot_mapping_migration.md
  D wasm/docs/dot_mapping_performance.md
  D wasm/docs/dot_mapping_styles.md
  D wasm/docs/superpixel_research.md
```

---

## Commit 12: Delete wasm/scripts migrated docs

```
docs: delete migrated wasm/scripts documentation

Content moved to docs/development/wasm-build.md.

Files:
  D wasm/scripts/INTERACTIVE_TEST_GUIDE.md
  D wasm/scripts/README.md
```

---

## Summary

| Commit | Type | Files |
|--------|------|-------|
| 1 | Add | 1 |
| 2 | Add | 3 |
| 3 | Add | 5 |
| 4 | Add | 5 |
| 5 | Add | 3 |
| 6 | Modify | 1 |
| 7 | Modify | 3 |
| 8 | Modify | 2 |
| 9 | Delete | 3 |
| 10 | Delete | 3 |
| 11 | Delete | 13 |
| 12 | Delete | 2 |
| **Total** | | **44 file operations** |

---

## Alternative: Single Squashed Commit

If you prefer one commit instead of 12 atomic commits:

```
docs: restructure documentation into centralized docs/ folder

Create docs/ directory with 17 organized markdown files:
  A docs/README.md
  A docs/getting-started/{installation,quick-start,browser-support}.md
  A docs/algorithms/{overview,edge-detection,dots-stippling,centerline,superpixel}.md
  A docs/development/{architecture,wasm-build,frontend-guide,testing,deployment}.md
  A docs/reference/{parameters,api}.md
  A docs/contributing.md

Update existing files:
  M README.md - Condense to focused overview, remove emojis
  M CLAUDE.md - Fix typos, remove duplicate section
  M frontend/CLAUDE.md - Remove emojis
  M wasm/CLAUDE.md - Remove emojis
  M frontend/README.md - Simplify, add docs links
  M wasm/vectorize-wasm/README.md - Add docs links

Delete migrated documentation:
  D CONFIG-REFACTOR-PLAN.md
  D DEPLOYMENT.md
  D WASM-REBUILD-README.md
  D frontend/TESTING-GUIDE.md
  D frontend/STORYBOOK.md
  D frontend/docs/ALGORITHM_PARAMETERS.md
  D wasm/docs/*.md (13 files)
  D wasm/scripts/*.md (2 files)
```

---

Delete this file after committing.
