const {validateManifest} = require('..');
const {readFileSync} = require('fs');
const {join} = require('path');
const assert = require('assert');

const examplesDir = join(__dirname, '..', 'examples');
const minimal = JSON.parse(readFileSync(join(examplesDir, 'minimal-manifest.json'), 'utf-8'));
const full = JSON.parse(readFileSync(join(examplesDir, 'full-manifest.json'), 'utf-8'));

function expectValid(label, manifest) {
  const result = validateManifest(manifest);
  assert.strictEqual(
    result.valid,
    true,
    `${label} should validate; errors: ${JSON.stringify(result.errors, null, 2)}`
  );
  console.log(`✓ ${label}`);
}

function expectInvalid(label, manifest, expectedKeyword) {
  const result = validateManifest(manifest);
  assert.strictEqual(result.valid, false, `${label} should NOT validate`);
  if (expectedKeyword) {
    assert.ok(
      result.errors.some((e) => e.keyword === expectedKeyword),
      `${label}: expected error keyword '${expectedKeyword}'; got ${JSON.stringify(result.errors)}`
    );
  }
  console.log(`✓ ${label}`);
}

/* fixtures pass */
expectValid('minimal manifest validates', minimal);
expectValid('full manifest (all 11 step kinds) validates', full);

/* missing required field */
{
  const m = {...minimal};
  delete m.target_version;
  expectInvalid('missing target_version fails', m, 'required');
}

/* unknown step kind */
{
  const m = JSON.parse(JSON.stringify(minimal));
  m.steps[0].kind = 'install_nonexistent';
  expectInvalid('unknown step kind fails', m);
}

/* additional properties on a step */
{
  const m = JSON.parse(JSON.stringify(minimal));
  m.steps[0].typo_field = 'oops';
  expectInvalid('extra property on step fails (additionalProperties: false)', m, 'additionalProperties');
}

/* schema_version must be exactly "1" */
{
  const m = {...minimal, schema_version: '2'};
  expectInvalid('schema_version "2" fails (only "1" allowed)', m, 'const');
}

/* arch must be amd64 in v1 */
{
  const m = {...minimal, arch: 'arm64'};
  expectInvalid('arch arm64 fails in v1', m, 'enum');
}

/* invalid semver */
{
  const m = {...minimal, target_version: '10.2.1-rc1'};
  expectInvalid('semver with pre-release tag fails', m, 'pattern');
}

/* invalid sha256 */
{
  const m = JSON.parse(JSON.stringify(minimal));
  m.steps[0].sha256 = 'not-a-sha';
  expectInvalid('non-hex sha256 fails', m, 'pattern');
}

/* set_env without value */
{
  const m = JSON.parse(JSON.stringify(full));
  /* find the patch_ecosystem_env step and break a set_env */
  const ecoStep = m.steps.find((s) => s.kind === 'patch_ecosystem_env');
  delete ecoStep.patches[0].value;
  expectInvalid('set_env patch without value fails', m);
}

/* unset_env with value (should still pass — value is just ignored) */
/* Actually our schema requires no value on unset_env via additionalProperties: false — so it should fail */
{
  const m = JSON.parse(JSON.stringify(full));
  const ecoStep = m.steps.find((s) => s.kind === 'patch_ecosystem_env');
  /* find the unset_env patch and add a stray value */
  const unsetPatch = ecoStep.patches.find((p) => p.op === 'unset_env');
  unsetPatch.value = 'should-not-be-here';
  expectInvalid('unset_env patch with value fails', m, 'additionalProperties');
}

/* missing steps */
{
  const m = {...minimal, steps: []};
  expectInvalid('empty steps array fails (minItems: 1)', m, 'minItems');
}

console.log('\nall tests passed');
