# Contributing to obdex

Thanks for helping. A few rules keep the data trustworthy.

## License of contributions

By submitting a pull request you agree that your contribution is dedicated to the public domain under [CC0-1.0](LICENSE-DATA) for any data files (YAML/JSON in `data/`, `schema/`, generated output) and released under the [MIT License](LICENSE-CODE) for any code (anything in `tools/` or build configuration). If you cannot make that dedication — for example because you are reproducing copyrighted text — please open an issue first instead of a PR.

## Ground rules

1. **Sources required.** Every new code or correction must reference at least one source: official service manual, OEM technical bulletin, ISO/SAE document, or a reproducible diagnostic procedure. Forum posts alone are not enough — they may be cited additionally, never as sole source.
2. **One file = one scope.** Generic codes go to `data/generic/`. Manufacturer codes go to `data/manufacturers/<vendor>/`. Never mix.
3. **No copyrighted text.** Do not paste manual descriptions verbatim. Write your own description in your own words. Identifiers, ranges, and bit-level facts are not copyrightable; prose is.
4. **Schema-valid.** PRs are validated automatically. Run `npm run check` locally before pushing — this runs schema validation and duplicate detection.

## Adding a code

1. Find the right file by code prefix (e.g. `P0420` → `data/generic/P0xxx.yaml`).
2. Insert the code in numeric order.
3. Fill at least: `code`, `scope`, `category`, `title.en`. German is encouraged but optional.
4. Add `sources:` with one or more URLs or document references.
5. Run validation, open PR.

## Adding a manufacturer

1. Create `data/manufacturers/<id>/_meta.yaml` using the existing files as template.
2. Start with one code file (e.g. `P1xxx.yaml`) — coverage grows from there.

The manufacturer index in `dist/manufacturers.json` is generated automatically from `_meta.yaml` files at build time; no manual index entry is needed.

## Adding a PID

1. Mode 01 / Mode 09 PIDs go to `data/pids/mode01.yaml` / `data/pids/mode09.yaml`. These are standardised in SAE J1979 / ISO 15031-5; `sources` are optional for them.
2. Manufacturer PIDs go to `data/pids/manufacturers/<id>.yaml` and **must** carry at least one `sources` entry.
3. Always provide `formula`, `unit`, `range`, `bytes` where applicable (bitmaps and ASCII PIDs may omit `formula`/`range`).

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
