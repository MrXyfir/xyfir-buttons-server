const crypto = require('lib/util/crypto');
const config = require('config');

/**
 * Encrypt access token and user-id for storage on client
 * @module
 * @param {number} uid - The user's internal id #
 * @param {string} token - The user's access token as received from xyAccounts
 * @returns {string} Encrypted string holding ${uid}-${token}
 */
module.exports = function(uid, token) {

  return crypto.encrypt(uid + '-' + token, config.keys.accessToken);

};