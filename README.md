# obdex

[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)

**The complete, open, machine-readable list of every generic OBD-II diagnostic trouble code — with bilingual descriptions, common causes, and repair estimates.**

If you are looking up a P-, B-, C- or U-code from your scan tool, this is a single source you can read, fork, and embed without paywalls or per-API fees.

## What you get

- **All 9,533 generic codes** of the SAE J2012 / ISO 15031-6 standard in one repository.
- **Plain English and German descriptions**, written from public sources, on every enriched code (currently 3,631 — growing wave by wave toward full coverage).
- **Per code:** title, description, affected components, common causes with likelihood, repair difficulty + cost + hours, MIL/emissions/limp-mode flags, sources.
- **132 OBD-II PIDs** (Mode 01 + Mode 09) with formulas and units.
- **CC0 data, MIT tooling.** Use it in your scan-tool app, garage software, training material — no attribution required, no licence fee.
- **Static JSON over CDN.** No API key, no rate limit, no account.

Manufacturer-specific codes (P1xxx, B1xxx, etc.) are deliberately out of scope — those are vendor IP. obdex covers only the generic layer that every OBD-II tool already speaks.

## Use

Direct JSON, served via GitHub Pages from `dist/`:

```
https://foerbsnavi.github.io/obdex/all.json
https://foerbsnavi.github.io/obdex/generic.json
https://foerbsnavi.github.io/obdex/pids/mode01.json
https://foerbsnavi.github.io/obdex/pids/mode09.json
https://foerbsnavi.github.io/obdex/meta.json
```

Each file also exists as a minified `.min.json` variant for production use:

```
https://foerbsnavi.github.io/obdex/all.min.json
```

Or clone the repo and read the YAML directly.

## Quickstart

```bash
git clone https://github.com/foerbsnavi/obdex.git
cd obdex
npm install
npm run check     # validate + duplicate detection
npm run build     # generate dist/
```

Requires Node.js ≥ 20.

## Structure

```
data/
├── generic/                          SAE J2012 codes, valid for all OBD-II vehicles
│   ├── <family>xxx_enriched.yaml     full schema (P0/P2/P3/U0/U3/B0/C0)
│   └── <family>xxx_stub.yaml         minimum schema, awaiting enrichment
└── pids/                             Live data parameter IDs (Mode 01, 09, …)

schema/                               JSON Schema (Draft 2020-12)
tools/                                Node.js validation + build scripts
```

Each generic-DTC family has at most two files — `_enriched.yaml` for fully described codes, `_stub.yaml` for minimum-schema entries. The build reads both recursively, so consumers see one merged dataset in `dist/`.

## Status

The database has two depth tiers per code:

- **enriched** — full schema: English+German title, description, affected components, common causes (with likelihood), repair difficulty/cost/hours, flags, references, sources.
- **indexed** — minimum schema: code, category, English title, source. Always passes validation, but no diagnostic detail yet. Indexed entries are progressively converted to enriched in subsequent waves.

| Family            |  Codes | Depth                            |
| ----------------- | -----: | -------------------------------- |
| Generic P0        |  3,705 | 1,005 enriched + 2,700 indexed   |
| Generic P2        |  3,495 | 293 enriched + 3,202 indexed     |
| Generic P3        |    155 | **155 enriched (100%)**          |
| Generic U0        |  1,055 | **1,055 enriched (100%)**        |
| Generic U3        |    174 | **174 enriched (100%)**          |
| Generic B0        |    323 | **323 enriched (100%)**          |
| Generic C0        |    626 | **626 enriched (100%)**          |
| **Generic total** |**9,533**| **3,631 enriched + 5,902 indexed** |
| PIDs Mode 01      |    119 | extensive                        |
| PIDs Mode 09      |     13 | extensive                        |

Live counts: see [`meta.json`](https://foerbsnavi.github.io/obdex/meta.json).

## Maintainer notes

GitHub Pages must be configured with **Source: GitHub Actions** in the repository settings before the first push to `main` for the release workflow to succeed.

## Schema

- [`schema/code.schema.json`](schema/code.schema.json) — DTC entries
- [`schema/pid.schema.json`](schema/pid.schema.json) — PID entries

JSON Schema Draft 2020-12. CI rejects any pull request that fails validation or introduces duplicate codes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: one PR per code or coherent batch, sources required, schema-validated automatically.

## License

- Data: [CC0-1.0](LICENSE-DATA) — public domain dedication.
- Code: [MIT](LICENSE-CODE).

SAE J2012 itself remains copyrighted. This repository contains independently authored descriptions referencing the publicly known code identifiers, not the SAE document text. Contributors must write their own descriptions in their own words — identifiers and bit-level facts are not copyrightable, but verbatim text from any service document is.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind, express or implied. Diagnostic trouble codes describe symptoms, not definitive faults — incorrect interpretation can lead to wrong repairs and damage. Always cross-check with the vehicle's service documentation and qualified diagnostic tools before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
