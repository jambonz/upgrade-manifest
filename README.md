# @jambonz/upgrade-manifest

JSON Schema and validator for jambonz upgrade-package manifests, used by [`update-server`](https://github.com/jambonz/update-server) and [`update-client`](https://github.com/jambonz/update-client).

## What's an upgrade manifest?

The JSON document that describes a single jambonz upgrade — source/target version, the ordered list of operations (`.deb` packages to install, app tarballs to extract, schema migrations to run, env-var patches, etc.), and per-step metadata. Authored by the jambonz release team, signed, and consumed by `update-client` running on each customer mini.

Full design context: [update-server/DESIGN.md §4](https://github.com/jambonz/update-server/blob/main/DESIGN.md).

## Install

```bash
npm install @jambonz/upgrade-manifest
```

## CLI

A standalone validation script is included — no global install or project setup needed beyond `npm install` in this directory:

```bash
cd upgrade-manifest/
npm install          # once
npx validate-manifest /path/to/manifest.json
```

Prints `OK` and exits 0 on success; prints all validation errors and exits 1 on failure.

## Usage (programmatic)

```js
const { validateManifest } = require('@jambonz/upgrade-manifest');
const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
const result = validateManifest(manifest);

if (!result.valid) {
  for (const err of result.errors) {
    console.error(`${err.instancePath || '(root)'}: ${err.message}`);
  }
  process.exit(1);
}

console.log(`Manifest valid; ${manifest.steps.length} steps to execute.`);
```

The schema itself is also exported, for callers that want to drive ajv directly:

```js
const { MANIFEST_SCHEMA } = require('@jambonz/upgrade-manifest');
```

## Editor support

Manifests can include a `$schema` reference for IDE autocomplete and inline validation. VS Code and JetBrains will fetch and cache the schema, then auto-complete the closed-vocabulary fields (`kind`, `op`, etc.) and flag missing required fields:

```json
{
  "$schema": "https://unpkg.com/@jambonz/upgrade-manifest@1/upgrade-manifest.schema.json",
  "schema_version": "1",
  ...
}
```

## Schema versioning

Two version numbers, deliberately decoupled:

- **package version** (`@jambonz/upgrade-manifest@1.x.y`) — follows npm semver. Patch / minor for backward-compatible additions; major for breaking changes to the validator API.
- **manifest `schema_version`** field — currently `"1"`. Bumped only on backward-incompatible manifest-shape changes. The schema enforces this with a `const` constraint, so old daemons reject manifests with an unknown `schema_version`.

A new manifest format that requires daemon-side changes also bumps the manifest's `min_daemon_version` field.

## Examples

The [`examples/`](examples/) directory has:

- [`minimal-manifest.json`](examples/minimal-manifest.json) — single-step manifest (drachtio version bump)
- [`full-manifest.json`](examples/full-manifest.json) — exercises all 11 step kinds for reference

## Test

```bash
npm test
```

The test suite validates the example fixtures pass, and that hand-crafted invalid manifests fail with the expected error keywords.

## Publishing

Pushed to npm via [`.github/workflows/publish.yml`](.github/workflows/publish.yml) on tag push (`v*`). To cut a release:

```bash
npm version patch   # or minor / major
git push --follow-tags
```

GitHub Actions handles the rest with `--access public --provenance`.
