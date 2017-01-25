const express = require('express');
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
    layouts: [],
    views: [],
    partials: []
  }
};

var bouvier = new Bouvier(bouvierOptions);

app.engine('bov', bouvier.render);
app.set('view engine', 'bov');

app.use(bouvier.process);

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

app.listen(3000);
