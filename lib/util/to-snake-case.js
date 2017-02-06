/**
 * Converts string to snake_case.
 * @module
 * @param {string} str - String to be converted.
 * @returns {string}
 */
module.exports = function(str) {

  return str
    .replace(/\.?([A-Z]+)/g, (a, b) => '_' + b.toLowerCase())
    .replace(/^_/, '');

};