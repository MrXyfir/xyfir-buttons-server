const toSnakeCase = require('lib/util/props-to-snake');
const request = require('superagent');

/**
 * Validates a button's data provided from the client and builds the data into
 * an object that can be inserted into the database.
 * @module
 * @param {object} button - Express's request.body object that contains the
 * button data from the request.
 * @param {string} button.name - The button's name.
 * @param {string} button.uriMatch - A regular expression string that the
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
 * @param {string} [button.styles] - A JSON string of an object containing the
 * button's custom styles.
 * @param {string} [button.icon] - The inner data of an <svg> icon.
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

  return new Promise((resolve, reject) => {
    // Finish building resolve object
    const finish = () => {
      button.description = button.description || '',
      button.repository = button.repository || '',
      button.isListed = !!+button.isListed,
      button.domains = button.domains || '',
      button.script = JSON.stringify(button.script),
      button.styles = JSON.stringify(button.styles);

      resolve(toSnakeCase(button));
    };

    // Validate data
    try {
      if (!button.name)
        throw 'Button must have a name';
      if (button.name.length > 50)
        throw 'Button name limited to 50 characters';
      if (!button.uriMatch)
        throw 'URI match does not exist';
      if (button.uriMatch.length > 500)
        throw 'URI match value limited to 500 characters';
      if (!button.script && !button.repository)
        throw 'No script file or repository link provided';
      if (button.domains && button.length > 100)
        throw 'Domains list limited to 100 characters';
      
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

      if (button.styles) {
        try {
          button.styles = JSON.parse(button.styles);
        }
        catch (e) {
          throw 'Invalid button styles';
        }
      }
      else {
        button.styles = {};
      }

      if (button.icon && button.icon.indexOf('<svg') == 0)
        throw 'Button icon must be the data *inside* of <svg>...</svg>';
      else
        button.icon = '';

      if (button.tooltip && button.tooltip.length > 255)
        throw 'Tooltip cannot be longer than 255 characters';
      else
        button.tooltip = button.name;

      // Validate repo and code within it
      if (button.repository) {
        const repoId = button.repository.split('/').slice(-1)[0];

        if (!repoId) throw 'Invalid repository link; must be a GitHub gist';

        request
          .get('https://api.github.com/gists/' + repoId)
          .end((err, res) => {
            try {
              if (!res.body.id)
                throw 'Invalid script repository link';
              if (res.body.truncated)
                throw 'Repository is too large';
              if (!res.body.files['main.js'] || !res.body.files['main.js'].content)
                throw 'Repository must have a non-empty main.js file';
              
              button.script = {};

              Object.keys(res.body.files).forEach(file => {
                if (res.body.files[file].truncated)
                  throw 'Repository is too large';
                
                button.script[file] = res.body.files[file].content;
              });

              finish();
            }
            catch (e) {
              reject(e);
            }
          });
      }
      else {
        finish();
      }
    }
    catch (e) {
      reject(e);
    }
  });

};