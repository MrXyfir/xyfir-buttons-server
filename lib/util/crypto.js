const crypto = require('crypto');

/**
 * Encrypts a string value with key using AES-256.
 * @module
 * @param {string} value - The string to encrypt
 * @param {string} encKey - The encryption key to use
 * @returns {string} An encrypted version of the value argument.
 */
exports.encrypt = function(value, encKey) {
  
  try {
    const cipher = crypto.createCipher('aes-256-ctr', encKey)
    let crypted = cipher.update(value, 'utf8', 'hex')
    
    crypted += cipher.final('hex');
    
    return crypted;
  }
  catch (e) { return ''; }
  
}

/**
 * Decrypts an AES-256 encrypted string value with key.
 * @module
 * @param {string} value - The string to decrypt
 * @param {string} decKey - The decryption key to use
 * @returns {string} A decrypted version of the value argument.
 */
exports.decrypt = function(value, decKey) {

  try {
    const decipher = crypto.createDecipher('aes-256-ctr', decKey)
    let dec = decipher.update(value, 'hex', 'utf8')
    
    dec += decipher.final('utf8');
    
    return dec;
  }
  catch (e) { return ''; }

}

/**
 * Hashes a string with provided algorithm.
 * @module
 * @param {string} value - The string to hash
 * @param {string} alg - The algorithm to hash the value with. Must be
 * supported by Node's crypto.createHash().
 * @returns {string} A hashed version of the value argument.
 */
exports.hash = function(value, alg) {

  return crypto.createHash(alg).update(value).digest('hex');

}