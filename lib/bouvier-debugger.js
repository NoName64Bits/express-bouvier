const colors = require('colors');

module.exports = {
  enable: true,
  error: function(head, body){
    if(module.exports.enable){
      console.log("[Bouvier-Error][".white + head.red + "]: ".white + body.white);
    }
  },
  log: function(head, body){
    if(module.exports.enable){
      console.log("[Bouvier-Log][".white + head.cyan + "]: ".white + body.white);
    }
  }
}
