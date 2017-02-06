const toSnakeCase = require('./to-snake-case');

/**
 * Convert the property names of an object to snake case.
 * @module
 * @param {object} obj - The object to modify the property names of.
 * @returns {object}
 */
module.exports = function(obj) {

  Object.keys(obj).forEach(prop => {
    const newProp = toSnakeCase(prop);

    if (prop != newProp) {
      obj[newProp] = obj[prop];
      delete obj[prop];
    }
  });

  return obj;

};