module.exports = {
  infect: infectObject
}

function infectObject(obj){
  return new InfectedObject(obj);
}

function InfectedObject(original){
  this.originalObject = original;
  this.infected = true;

  var keys = Object.keys(original);

  for(var i = 0; i < keys.length; i++){
    this[keys[i]] = original[keys[i]];
  }

  var parent = this;

  this.utils = {
    find: function(property, defaultValue){
      var originalObj = Object.create(parent.originalObject);
      var result = findProp(originalObj, property, defaultValue);
      return result;
    },
    clone: function(original){
      if(original)
        return Object.create(parent.originalObject);

      return Object.create(parent);
    }
  }
}

function findProp(obj, prop, defval){
    if (typeof defval == 'undefined') defval = null;
    prop = prop.split('.');
    for (var i = 0; i < prop.length; i++) {
        if(typeof obj[prop[i]] == 'undefined')
            return defval;
        obj = obj[prop[i]];
    }
    return obj;
}
