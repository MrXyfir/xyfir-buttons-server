const config = require('config');

/**
 * Middleware for 'api/' routes in production environment that only allows
 * error messages sent out that were thrown as a string. This prevents the end
 * user from seeing error messages not thrown by the top-level applciation.
 * In development environments the message object is converted to a string.
 * @module
 * @param {object} req - Express request object
 * @param {object} res - Express reponse object
 * @param {function} next - Express next function
 */
const forProd = function(req, res, next) {
  
  res._json = res.json;
  
  res.json = function(obj) {
    if (obj.error && typeof obj.message == 'object')
      obj.message = 'An unknown error occured';
    
    res._json(obj);
  };

  next();

},
forDev = function(req, res, next) {
  
  res._json = res.json;

  res.json = function(obj) {
    if (obj.error && typeof obj.message == 'object')
      obj.message = obj.message.toString();
    
    res._json(obj);
  };

  next();

};

module.exports = config.environment.type == 'dev' ? forDev : forProd;