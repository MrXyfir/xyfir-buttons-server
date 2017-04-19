const toSnakeCase = require('lib/util/props-to-snake');
const rstring = require('randomstring');

/**
 * Validates a preset's data provided from the client and builds the data into
 * an object that can be inserted into the database.
 * @module
 * @param {object} preset - Express's request.body object that contains the
 * preset data from the request.
 * @param {string} preset.name - The preset's name.
 * @param {string} preset.urlMatch - A regular expression string that the
 * client's current location.href must match if preset is to be loaded.
 * @param {string} [preset.description] - The preset's description.
 * @param {string} [preset.domains] - A comma delimited list of domains that
 * the preset should work on. Is used strictly for searching and has no impact
 * on the preset's behavior. Can be '*' to denote a global matching preset or
 * '**' to denote a preset that matches too many sites to list.
 * @param {boolean} [preset.isListed] - If true, the preset will be
 * publicly listed, otherwise it will be unlisted.
 * @param {boolean} [preset.key] - If true, generate a modifier key.
 * @returns {Promise} A promise that resolves to a modified version of the
 * preset argument if provided data is valid and rejects if any of the data
 * is invalid or on error.
 * Modifications made to preset on resolve:
 * - Any values not present will be added with default values.
 * - Property names are modified to snake case to work with columns in
 * xyfir_buttons.presets table.
 */
module.exports = function(preset) {

  return new Promise((resolve, reject) => {
    // Validate data
    try {
      if (!preset.name)
        throw 'Preset must have a name';
      if (preset.name.length > 100)
        throw 'Preset name limited to 100 characters';
      if (!preset.urlMatch)
        throw 'URL match does not exist';
      if (preset.urlMatch.length > 1000)
        throw 'URL match value limited to 1000 characters';
      if (preset.domains && preset.domains.length > 250)
        throw 'Domains list limited to 250 characters';
      
      preset.description = preset.description || '',
      preset.isListed = !!+preset.isListed,
      preset.domains = preset.domains || '';

      if (!!+preset.key) {
        preset.modKey = rstring.generate(40);
        delete preset.key;
      }
      
      resolve(toSnakeCase(preset));
    }
    catch (e) {
      reject(e);
    }
  });

};