# obdex

[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)

Open, machine-readable database of OBD-II diagnostic trouble codes (DTCs) and PIDs.

Generic codes follow the publicly known SAE J2012 identifier scheme. Manufacturer-specific codes are contributed by the community based on service literature, reproducible diagnostics, and shared experience.

## Why

Workshop databases like Autodata, Haynes Pro, or Bosch ESI cost thousands per year. The codes themselves are public knowledge — only their structured aggregation is locked behind paywalls. obdex closes that gap.

## Use

Direct JSON, served via GitHub Pages from `dist/`:

```
https://foerbsnavi.github.io/obdex/all.json
https://foerbsnavi.github.io/obdex/generic.json
https://foerbsnavi.github.io/obdex/manufacturers.json
https://foerbsnavi.github.io/obdex/by-manufacturer/vag.json
https://foerbsnavi.github.io/obdex/pids/mode01.json
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
├── generic/              SAE-defined codes, valid for all OBD-II vehicles
├── manufacturers/        Vendor-specific extensions
│   ├── vag/              Volkswagen, Audi, Skoda, Seat, Cupra
│   ├── bmw/
│   ├── mercedes/
│   ├── stellantis/       Fiat, Peugeot, Citroën, Opel, Jeep, …
│   ├── ford/
│   └── toyota/
└── pids/                 Live data parameter IDs (Mode 01, 09, …)
    └── manufacturers/    Vendor-specific PIDs

schema/                   JSON Schema (Draft 2020-12)
tools/                    Node.js validation + build scripts
```

## Status

Early release — generic coverage is being built up; manufacturer-specific codes are community-driven.

| Scope         | Codes | Coverage |
| ------------- | ----: | -------- |
| Generic P0    |   174 | growing  |
| Generic P2    |    56 | growing  |
| Generic U0    |    41 | growing  |
| Generic B0    |    20 | seed     |
| Generic C0    |    20 | seed     |
| VAG           |     1 | seed     |
| BMW           |     0 | wanted   |
| Mercedes      |     0 | wanted   |
| Stellantis    |     0 | wanted   |
| Ford          |     0 | wanted   |
| Toyota        |     0 | wanted   |
| PIDs Mode 01  |    11 | seed     |
| PIDs Mode 09  |     4 | seed     |

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

SAE J2012 itself remains copyrighted. This repository contains independently authored descriptions referencing the publicly known code identifiers, not the SAE document text.

Manufacturer service manuals are also copyrighted. Contributors must write their own descriptions in their own words — identifiers and bit-level facts are not copyrightable, but verbatim manual text is. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Trademarks

All manufacturer names, brand names, and model designations are trademarks of their respective owners. Their use in this repository is purely descriptive — to identify which vehicles a particular code applies to. obdex is an independent community project and is not affiliated with, endorsed by, or sponsored by any vehicle manufacturer, SAE International, ISO, or any commercial diagnostic database.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind, express or implied. Diagnostic trouble codes describe symptoms, not definitive faults — incorrect interpretation can lead to wrong repairs and damage. Always cross-check with the vehicle's service documentation and qualified diagnostic tools before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
