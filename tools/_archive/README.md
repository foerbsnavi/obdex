# Archived tools

One-shot migration scripts that have already been applied to the dataset and are kept for historical reference only.

- **`add_wikipedia_sources.mjs`** — Wave 19 migration that added a Wikipedia URL alongside Wal33D as the source on every enriched code that previously had only Wal33D as its source. After this ran, every enriched code carries at least one Wikipedia reference. The mapping is pattern-based (DTC title → Wikipedia article) and was executed once; running it again is a no-op on the current dataset.

These scripts are not part of the regular `npm run check` / `npm run build` pipeline and should not be touched without good reason.
