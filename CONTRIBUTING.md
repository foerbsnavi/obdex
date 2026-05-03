# Contributing to obdex

Thanks for helping. A few rules keep the data trustworthy.

## Scope

obdex covers **generic** OBD-II codes only — those defined by SAE J2012 and ISO 15031-6 and valid across all manufacturers. Manufacturer-specific codes (P1xxx, B1xxx, etc.) are deliberately out of scope and will not be merged.

## License of contributions

By submitting a pull request you agree that your contribution is dedicated to the public domain under [CC0-1.0](LICENSE-DATA) for any data files (YAML/JSON in `data/`, `schema/`, generated output) and released under the [MIT License](LICENSE-CODE) for any code (anything in `tools/` or build configuration). If you cannot make that dedication — for example because you are reproducing copyrighted text — please open an issue first instead of a PR.

## Ground rules

1. **Sources required.** Every new code or correction must reference at least one source: ISO/SAE document, public technical reference, or a reproducible diagnostic procedure. Forum posts alone are not enough — they may be cited additionally, never as sole source.
2. **No copyrighted text.** Do not paste manual descriptions verbatim. Write your own description in your own words. Identifiers, ranges, and bit-level facts are not copyrightable; prose is.
3. **Schema-valid.** PRs are validated automatically. Run `npm run check` locally before pushing — this runs schema validation and duplicate detection.

## Adding a code

1. Find the right file by code prefix (e.g. `P0420` → `data/generic/P0xxx_enriched.yaml` if you have a full description, or `P0xxx_stub.yaml` for a minimum-schema entry).
2. Insert the code in numeric order.
3. For **enriched** entries, fill: `code`, `category`, `title.en+de`, `description.en+de`, `common_causes` (where known), `repair`, `flags`, `references`, `sources`.
4. For **stub** entries, fill at minimum: `code`, `category`, `title.en`, `sources`.
5. Run `npm run check` locally, open PR.

If you're enriching a stub entry, move it from `*_stub.yaml` to `*_enriched.yaml` in the same PR — duplicates are blocked by CI.

## Adding a PID

1. Mode 01 / Mode 09 PIDs go to `data/pids/mode01.yaml` / `data/pids/mode09.yaml`. These are standardised in SAE J1979 / ISO 15031-5; `sources` are optional for them.
2. Always provide `name`, `mode`, `bytes`. Add `formula`, `unit`, `range` where applicable (bitmaps and ASCII PIDs may omit `formula`/`range`).

## Likelihood field

Use sparingly and honestly:

- `high` — confirmed by multiple independent shop reports or OEM TSB.
- `medium` — common but not dominant cause.
- `low` — known to occur, rare in practice.

If unsure, omit `common_causes` rather than guess.

## Style

- YAML, two-space indent, no trailing whitespace.
- Lowercase IDs, `snake_case` for cause IDs.
- ISO 4217 for currencies, ISO 639-1 for languages.
- Code identifiers always uppercase: `P0420`, never `p0420`.

## Review

Reviewers check: schema validity, source quality, no verbatim copyrighted text, plausibility. Maintainers may rephrase or drop sources without further discussion.
