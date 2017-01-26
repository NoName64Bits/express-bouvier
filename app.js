const express = require('express');
const socketIo = require('socket.io');

var app = express();
var io = socketIo(3000);

const Bouvier = require('./lib/bouvier');

var bouvierOptions = {
  local: __dirname,
  debug: true,
  express: app,
  hashSecret: "querty1234",
  layouts: 'layouts',
  views: 'views',
  partials: 'partials',
  useables: {
    switchBox: 'switch.bov',
    layouts: [],
    views: [],
    partials: []
  }
};

var bouvier = new Bouvier(bouvierOptions);

app.engine('bov', bouvier.render);
app.set('view engine', 'bov');

app.use(bouvier.process);

app.get('/bouvier/uuid', function(request, response) {
  response.send("var UUID = '" + request.bouvier.user.id + "';");
});

var users = {};
var count = 0;

io.sockets.on('connection', function(socket){
  socket.on('bouvier-connect', function(data){
    if(!users[data.user]){
      users[data.user] = [];
    }
    users[data.user].push(socket.id);
    console.log(users[data.user]);
    console.log("User connected: " + data.user + " - " + socket.id);
  });

  socket.on('bouvier-trigger', function(data){
    console.log(socket.id + " : " + JSON.stringify(data));
    findUserBySocket(socket.id);
    if(data.target == 'increment'){
      for(var i = 0; i < data.attributes.length; i++){
        if(data.attributes[i].name == 'count'){
          count += Number(data.attributes[i].value);
          updateBySocketID(socket.id, {id: "count", content: count});
          console.log(count);
        }
      }
    }
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

app.get('/socket/:id', function(req, res){
  for(var i = 0; i < users[req.params.id].length; i++){
    io.sockets.sockets[users[req.params.id][i]].emit('bouvier-update', {id: "count", content: count});
  }
  res.send(typeof io.sockets.sockets[users[req.params.id][0]]);
});

function updateBySocketID(socket, data){
  var sockets = findUserBySocket(socket);
  console.log(sockets);
  for(var i = 0; i < sockets.length; i++){
    io.sockets.sockets[sockets[i]].emit('bouvier-update', data);
  }
}

function updateByUserID(user, data){
  for(var i = 0; i < users[user].length; i++){
    io.sockets.sockets[users[user][i]].emit('bouvier-update', data);
  }
}

function findUserBySocket(socket){
  for(var i = 0; i < Object.keys(users).length; i++){
    var user = users[Object.keys(users)[i]];
    if(user.indexOf(socket) >= 0){
      return user;
    }
  }
}

function findSocketsByUser(user){
  if(users[user]){
    return users[user];
  } else {
    return [];
  }
}

app.get('/:title', function(request, response){
  response.render("home",
    {
      info: request.params.title,
      user: {
        id: 1,
        names: ["Ciobanu", "Laurentiu"]
      }
    });
});

app.listen(8080, function(){
  console.log("Listening for clients on *:8080");
});
