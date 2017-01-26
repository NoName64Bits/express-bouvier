const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const uaParser = require('express-useragent');
const path = require('path');
const fs = require('fs')
const socketIo = require('socket.io');

const error = require('./bouvier-error');
const debug = require('./bouvier-debugger');
const utils = require('./bouvier-utils');

module.exports = Bouvier;

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function Bouvier(options){
  if(!options){
    var err = new error.BouvierError(error.ErrorTypes.NullObject, "'options' object may not be null or empty!");
    err.emit();
    return;
  }

  if(Object.keys(options).length <= 0){
    var err = new error.BouvierError(error.ErrorTypes.EmptyObject, "'options' object may not be null or empty!");
    err.emit();
    return;
  }
  this.options = options;

  if(!this.options.hashSecret){
    var err = new error.BouvierError(error.ErrorTypes.ObjectDoesNotSatisfy, "'options' object should contain the 'hashSecret' property");
    err.emit();
    return;
  }

  if(!this.options.local){
    var err = new error.BouvierError(error.ErrorTypes.ObjectDoesNotSatisfy, "'options' object should contain the 'local' property");
    err.emit();
    return;
  }

  if(!this.options.express){
    var err = new error.BouvierError(error.ErrorTypes.ObjectDoesNotSatisfy, "'options' object should contain the 'express' property");
    err.emit();
    return;
  }

  if(!this.options.debug){
    debug.enable = false;
    error.enable = false;
  } else {
    debug.enable = true;
    error.enable = true;
  }

  this.options.express.use(cookieParser());
  this.options.express.use(session({secret: this.options.hashSecret, resave: true, saveUninitialized: true}));
  this.options.express.use(uaParser.express());

  this.users = [];
  this.count = 0;
  this.io = socketIo(3000);

  this.io.sockets.on('connection', function(socket){
    socket.on('bouvier-connect', function(data){
      if(!vet.users[data.user]){
        vet.users[data.user] = [];
      }
      vet.users[data.user].push(socket.id);
      debug.log("SocketManager", "New user: " + data.user + " - " + socket.id);
    });

    socket.on('bouvier-trigger', function(data){
      console.log(socket.id + " : " + JSON.stringify(data));
      findUserBySocket(socket.id);
      if(data.target == 'increment'){
        for(var i = 0; i < data.attributes.length; i++){
          if(data.attributes[i].name == 'count'){
            vet.count += Number(data.attributes[i].value);
            updateBySocketID(socket.id, {id: "count", content: vet.count});
          }
        }
      }
    });

    socket.on('disconnect', function(){
      for(var i = 0; i < Object.keys(vet.users).length; i++){
        for(var j = 0; j < vet.users[Object.keys(vet.users)[i]].length; j++){
          if(vet.users[Object.keys(vet.users)[i]][j] == socket.id){
            vet.users[Object.keys(vet.users)[i]][j] = null;
          }
          vet.users[Object.keys(vet.users)[i]].clean(null);
        }
      }
    });
  });

  this.update = function(to, data){

  }

  function updateBySocketID(socket, data){
    var sockets = findUserBySocket(socket);
    for(var i = 0; i < sockets.length; i++){
      if(vet.io.sockets.sockets[sockets[i]]){
        vet.io.sockets.sockets[sockets[i]].emit('bouvier-update', data);
      }
    }
  }

  function updateByUserID(user, data){
    for(var i = 0; i < vet.users[user].length; i++){
      vet.io.sockets.sockets[vet.users[user][i]].emit('bouvier-update', data);
    }
  }

  function findUserBySocket(socket){
    for(var i = 0; i < Object.keys(vet.users).length; i++){
      var user = vet.users[Object.keys(vet.users)[i]];
      if(user.indexOf(socket) >= 0){
        return user;
      }
    }
  }

  function findSocketsByUser(user){
    if(vet.users[user]){
      return vet.users[user];
    } else {
      return [];
    }
  }

  this.locations = {
    local: this.options.local
  };

  if(!this.options.layouts){
    this.locations.layouts = path.join(this.options.local, "layouts");
  } else {
    this.locations.layouts = path.join(this.options.local, this.options.layouts);
  }

  if(!this.options.views){
    this.locations.views = path.join(this.options.local, "views");
  } else {
    this.locations.views = path.join(this.options.local, this.options.views);
  }

  if(!this.options.partials){
    this.locations.partials = path.join(this.options.local, "partials");
  } else {
    this.locations.partials = path.join(this.options.local, this.options.partials);
  }

  this.options.express.set('views', this.locations.views);

  this.render = function(path, options, callback){
    var file = path.split("\\")[path.split("\\").length - 1];
    debug.log("Render", "Rendering " + file + " using _");

    fs.readFile(path, "utf8", function (err,data) {
      if (err) {
        callback(err, null);
        err = new error.BouvierError(error.ErrorTypes.FileRead, "Can't read view file <'" + file + "'>");
        err.emit();
        return;
      }
      callback(null, parseView(data, options));
    });
  };

  this.test = parseView;

  var vet = this;
  this.process = function(request, response, next){
    request.bouvier = {
      user: {
        agent: request.useragent,
        info: {
          mobile: request.useragent.isMobile,
          platform: request.useragent.platform,
          os: request.useragent.os,
          browser: request.useragent.browser,
          browserVersion: request.useragent.version
        },
        id: 'ciobanu'
      }
    };

    if(!request.bouvier.firstPorcess){
      vet.init();
      request.bouvier.firstPorcess = true;
    }
    next();
  };

  this.init = function(request, response, next){
    this.options.express.get('/bouvier/uuid', function(request, response){
      debug.log("ResourceLoader", "Loaded /bouvier/uuid");
      response.send("var UUID = '" + request.bouvier.user.id + "';");
    });

    this.options.express.get('/bouvier/dynamics', function(request, response){
      debug.log("ResourceLoader", "Loaded /bouvier/dynamics");
      response.sendFile(path.join(__dirname, "client", "dynamics.js"))
    });
  };

  debug.log("Constructor", "Initialization went ok");
  debug.log("Process", "Serving /bouvier/dynamics from: " + path.join(__dirname, "client/dynamics.js"));
}

function parseView(html, options) {
   var re = new RegExp("<bov>(.+?)</bov>", "g"),
     reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
     code = 'with(obj) { var r=[];\n',
     cursor = 0,
     result,
     match;

   var add = function(line, js) {
     js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
       (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
     return add;
   }

   while(match = re.exec(html)) {
     add(html.slice(cursor, match.index))(match[1], true);
     cursor = match.index + match[0].length;
   }

   add(html.substr(cursor, html.length - cursor));
   code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, ' ');
   try { result = new Function('obj', code).apply(options, [options]); }
   catch(err) { console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n"); }
   return result;
}
