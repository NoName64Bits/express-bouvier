const debug = require('./bouvier-debugger');

module.exports = {
  BouvierError: BouvierError,
  ErrorTypes: {
    NullObject: "<NullObject>",
    EmptyObject: "<EmptyObject>",
    ObjectDoesNotSatisfy: "<ObjectDoesNotSatisfy>",
    FileRead: "<FileRead>"
  },
  enable: true
};

function BouvierError(type, description){
  this.type = type;
  this.description = description;
  this.emit = function(){
    var errorText = "";
    errorText += (this.type + " :\n" + this.description + "\n");
    Error.captureStackTrace(this);
    var stackLines = this.stack.split("\n");
    for(var i = 1; i < 5; i++){
      errorText += (stackLines[i] + "\n");
    }
    if(module.exports.enable){
      debug.error("Report", errorText);
    }
  }
}
