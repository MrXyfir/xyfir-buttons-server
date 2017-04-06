module.exports = function(str) {
  
  return new Buffer(str, 'base64').toString('binary');

}