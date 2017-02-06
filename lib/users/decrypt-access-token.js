const crypto = require('lib/util/crypto');
const config = require('config');

/**
 * @typedef {Object} DecryptedAccessToken
 * @property {number} user - The user's internal id
 * @property {string} token - The xyAccounts access token
 */

/**
 * Decrypts client-side access token string that holds a user id and matching
 * access token to be validated with xyAccounts.
 * @module
 * @param {string} token - The user's access token as received from xyAccounts
 * @returns {DecryptedAccessToken} An object containing the user's id and
 * access token.
 */
module.exports = function(token) {

  const t = crypto.decrypt(token, config.keys.accessToken).split('-');

  return {
    user: (+t[0] || 0), token: (t[1] || '')
  };

};