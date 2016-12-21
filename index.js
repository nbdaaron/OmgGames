var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var C4 = require('./C4');

var currID = 1;

app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');

});

app.get('/c4', function(req, res) {
  C4.handle(req, res, io);
  //res.sendFile(__dirname+'/C4.html');
})

app.use(express.static('static'));

  var C4IO = io.of('/C4');
  C4IO.on('connection', C4.on);
  var C4LobbyIO = io.of('/C4Lobby');
  C4LobbyIO.on('connection', C4.lobbyOn);



var port = process.env.PORT || 3000
http.listen(port, function(){
  console.log('listening on *:' + port);
});