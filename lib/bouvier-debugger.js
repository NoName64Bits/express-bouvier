const colors = require('colors');

module.exports = {
  enable: true,
  error: function(head, body){
    if(module.exports.enable){
      console.log("[Bouvier-Error][".yellow + head.red + "]: ".yellow + body.yellow);
    }
  },
  log: function(head, body){
    if(module.exports.enable){
      console.log("[Bouvier-Log][".yellow + head.cyan + "]: ".yellow + body.yellow);
    }
  }
}
