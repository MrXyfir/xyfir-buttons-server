const buildFromRepo = require('lib/buttons/build-from-repository');
const buildFromGist = require('lib/buttons/build-from-gist');
const toSnakeCase = require('lib/util/props-to-snake');
const request = require('superagent');

/**
 * Validates a button's data provided from the client and builds the data into
 * an object that can be inserted into the database.
 * @module lib/buttons/validate-and-build
 * @param {object} button - Express's request.body object that contains the
 * button data from the request.
 * @param {string} button.name - The button's name.
 * @param {string} button.urlMatch - A regular expression string that the
 * client's current location.href must match if button is to be inserted.
 * @param {string} [button.script] - A JSON string containing and object with
 * the button's 'files' to run. Not needed if repository property exists and
 * points to a valid GitHub gist.
 * @param {string} [button.repository] - A link to a GitHub gist that contains
 * files for a button script.
 * @param {string} [button.description] - The button's description.
 * @param {string} [button.domains] - A comma delimited list of domains that
 * the button should work on. Is used strictly for searching and has no impact
 * on the button's behavior. Can be '*' to denote a global matching button or
 * '**' to denote a button that matches too many sites to list.
 * @param {boolean} [button.isListed] - If present and truthy, the button will
 * be publicly listed, otherwise it will be unlisted.
 * @param {string} [button.tooltip] - The text displayed in a tooltip when the
 * button is hovered over.
 * @param {string} [button.styles] - A JSON string of an HTMLElement.style
 * object containing the button's custom styles.
 * @param {string} [button.content] - The button's text content. A URI encoded
 * string that contain any characters, including emojis.
 * @returns {Promise} A promise that resolves to a modified version of the
 * button argument if provided data is valid and rejects if any of the data
 * is invalid or on error.
 * Modifications made to button on resolve:
 * - If button.script is empty, it is changed to '{}'
 * - If button.repository, the files are downloaded and built into an object
 * set to button.script.
 * - Any values not present will be added with default values.
 * - Property names are modified to snake case to work with columns in
 * xyfir_buttons.buttons table.
 */
module.exports = function(button) {

  return new Promise(async (resolve, reject) => {
    // Validate data
    try {
      if (!button.name)
        throw 'Button must have a name';
      if (button.name.length > 100)
        throw 'Button name limited to 100 characters';
      if (!button.urlMatch)
        throw 'URL match does not exist';
      if (button.urlMatch.length > 1000)
        throw 'URL match value limited to 1000 characters';
      if (!button.script && !button.repository)
        throw 'No script file or repository link provided';
      if (button.domains && button.domains.length > 250)
        throw 'Domains list limited to 250 characters';
      
      if (button.script) {
        try {
          button.script = JSON.parse(button.script);
        }
        catch (e) {
          throw 'Invalid button script';
        }

        if (!button.script['main.js'])
          throw 'Button script must have a non-empty main.js file';
      }
      else {
        button.script = {};
      }

      button.styles = String(button.styles);

      if (!button.styles)
        button.styles = '{}';
      else if (button.styles[0] != '{')
        throw 'Invalid styles object, must start with "{"';
      else if (button.styles[button.styles.length - 1] != '}')
        throw 'Invalid styles object, must end with "}"';

      if (!button.content) button.content = '';

      if (button.tooltip && button.tooltip.length > 255)
        throw 'Tooltip cannot be longer than 255 characters';
      else
        button.tooltip = button.name;

      // Validate repo and code within it
      if (button.repository) {
        // $1 = not undefined if gist
        // $2 = user/repoId|gistId
        // $3 = user
        // $4 = repoId|gistId
        const regex = /^https:\/\/(gist\.)?github\.com\/((.+)\/(.+))/;
        const match = button.repository.match(regex);
        
        let url = 'https://api.github.com/', isGist = false;

        if (!match)
          throw 'Invalid repository link. Must be Github repo or Gist';
        else if (match[1] && match[4])
          url += 'gists/' + match[4], isGist = true;
        else if (match[4])
          url += 'repos/' + match[2] + '/contents';
        else
          throw 'Invalid Github repository or Gist link';

        const res = await request.get(url);

        if (isGist)
          button.script = buildFromGist(res.body);
        else
          Object.assign(button, await buildFromRepo(url, res.body));
      }
      
      button.description = button.description || '',
      button.repository = button.repository || '',
      button.isListed = !!+button.isListed,
      button.domains = button.domains || '',
      button.script = JSON.stringify(button.script),
      button.styles = button.styles;

      resolve(toSnakeCase(button));
    }
    catch (e) {
      reject(e);
    }
  });

};