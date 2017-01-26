const express = require('express');
const socketIo = require('socket.io');

var app = express();

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
    repository: 'repo.json',
    layouts: [],
    views: [],
    partials: []
  }
};

var bouvier = new Bouvier(bouvierOptions);

app.engine('bov', bouvier.render);
app.set('view engine', 'bov');

app.use(bouvier.process);
//bouvier.init();

var users = {};
var count = 0;


app.get('/home/:title', function(request, response){
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
