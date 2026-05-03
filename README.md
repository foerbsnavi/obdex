# obdex

[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)

Open, machine-readable database of generic OBD-II diagnostic trouble codes (DTCs) and PIDs.

Codes follow the publicly known SAE J2012 identifier scheme and ISO 15031-6. The project deliberately limits itself to the generic, standard-defined layer — manufacturer-specific codes are out of scope.

## Why

Workshop databases like Autodata, Haynes Pro, or Bosch ESI cost thousands per year. The codes themselves are public knowledge — only their structured aggregation is locked behind paywalls. obdex closes that gap for the generic layer that every OBD-II tool needs.

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
├── generic/              SAE J2012 codes, valid for all OBD-II vehicles
└── pids/                 Live data parameter IDs (Mode 01, 09, …)

schema/                   JSON Schema (Draft 2020-12)
tools/                    Node.js validation + build scripts
```

## Status

The database has two depth tiers per code:

- **enriched** — full schema: English+German title, description, affected components, common causes (with likelihood), repair difficulty/cost/hours, flags, references, sources.
- **indexed** — minimum schema: code, category, English title, source. Always passes validation, but no diagnostic detail yet. Indexed entries are progressively converted to enriched in subsequent waves.

| Family            |  Codes | Depth                            |
| ----------------- | -----: | -------------------------------- |
| Generic P0        |  3,705 | 605 enriched + 3,100 indexed     |
| Generic P2        |  3,495 | 293 enriched + 3,202 indexed     |
| Generic P3        |    155 | 97 enriched + 58 indexed         |
| Generic U0        |  1,056 | 227 enriched + 829 indexed       |
| Generic U3        |    174 | indexed                          |
| Generic B0        |    323 | 200 enriched + 123 indexed       |
| Generic C0        |    626 | 207 enriched + 419 indexed       |
| **Generic total** |**9,534**| **1,629 enriched + 7,905 indexed** |
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
