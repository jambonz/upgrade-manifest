const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const {readFileSync} = require('fs');
const {resolve} = require('path');
const debug = require('debug')('jambonz:upgrade-manifest:validator');

const schemaPath = resolve(__dirname, '..', 'upgrade-manifest.schema.json');
const MANIFEST_SCHEMA = JSON.parse(readFileSync(schemaPath, 'utf-8'));

let _validate = null;

function getValidator() {
  if (_validate) return _validate;

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false,
  });
  addFormats(ajv);
  _validate = ajv.compile(MANIFEST_SCHEMA);
  debug('manifest schema compiled');
  return _validate;
}

/**
 * Validate a parsed upgrade manifest against the schema.
 *
 * @param {object} manifest - parsed JSON contents of manifest.json
 * @returns {{valid: boolean, errors: array}} `valid` is true on success;
 *   `errors` is the ajv error array on failure (empty array on success).
 */
function validateManifest(manifest) {
  const validate = getValidator();
  const valid = validate(manifest);
  return {
    valid: !!valid,
    errors: valid ? [] : (validate.errors || []),
  };
}

module.exports = {
  validateManifest,
  MANIFEST_SCHEMA,
};
