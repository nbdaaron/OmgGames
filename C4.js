var index = require('./index');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var games = new Array();
var ids = ["Cutie Patootie", "Chilly Nilly", "Silly Billy", "Chubby Dubby", "Little Skittle", "Teensy Weensy", "Pwnerlord", "Swagmaster", "Billybob", "Harambe"];
var users = new Array();

module.exports = {

	handle: function(req, res, io) {
		console.log(index);
		index.a();
		res.sendFile(__dirname+'/C4.html');
	},

	on: function(socket){
		socket.on('disconnect', disconnected);
	},

	lobbyOn: function(socket) {
		socket.on('disconnect', disconnected);
		socket.on('generateGame', generateGame);
		socket.on('generateUser', 	function(msg, io) {
			generateUser(msg, io, socket);
		});

		socket.on('getStats', 	function(msg, io) {
			getStats(msg, io, socket);
		});

		socket.on('enterUser', function enterUser(msg, io) {
			if (userExists(msg)) {
				getStats(msg, io, socket);
				return;
			}
			index.conn.query('Select * from users where username = "' + msg + '";', function(error, results, fields) {
				if (results[0] != null) {
					users[msg] = {
						id: results[0].id,
						name: results[0].username,
						guest: false,
						wins: 0,
						losses: 0,
						ties: 0,
						gm: results[0].gm
					};
					updateStats(results[0].id, msg, io, socket);
				}
				else {
					generateUser(msg, io, socket);
					return;
				}
			});
		});
		socket.on('save', function(msg, io) {
			save(msg, io, socket);
		})
	}

};

function received(msg, io) {
	console.log(msg);
}

function generateGame(msg, io) {
	
}

function updateStats(userID,username,io, socket) {
		index.conn.query('Select * from stats where userid = "' + userID + '" and gameid = 1;', function(error, results, fields) {
			if (results[0] != null) {
				users[username].wins = results[0].wins;
				users[username].losses = results[0].losses;
				users[username].ties = results[0].ties;
			}
			else {
				index.conn.query('Insert into stats(userid, gameid, wins, losses, ties) values("'+userID+'", 1, 0,0,0);', function(err, result) {
					if (err) console.log(err);
				});
			}
			getStats(username, io, socket);
		});
}






function userExists(id) {
	console.log(id);
	console.log(users);
	//console.log(users[id]);
	return users[id] != null;
}

function disconnected(msg) {
	//console.log("User disconnected");
}

function newRoom(p1) {
	games[games.length] = {
		id: games.length,
		grid: new Array(),
		p1: p1,
		p2: null
	};
	for (var i=0;i<7;i++) {
		grid[i] = new Array();
	}
}

function generateUser(msg, io, socket) {
	var id;
	do {
		id = ids[parseInt(Math.random() * ids.length)] + " " + parseInt(Math.random()*1000);
	} while (userExists(id));

	users[id] = {
		id: -1,
		name: id,
		guest: true,
		wins: 0,
		losses: 0, 
		ties: 0,
		gm: 0
	};
	socket.emit("userMade", id);
}

function getStats(msg, io, socket) {
	if (userExists(msg)) {
		socket.emit("stats", {
			wins: users[msg].wins,
			losses: users[msg].losses,
			ties: users[msg].ties
		});
	}
	//return null;
}

function save(msg, io, socket) {
	if (userExists(msg) && users[msg].gm>0) {
		for (var property in users) {
		    if (users.hasOwnProperty(property)) {
		        index.conn.query('update stats set wins='+users[property].wins+', losses='+users[property].losses+', ties='+users[property].ties+' where userid = ' + users[property].id + ';', function(err, result) {
					if (err) console.log(err);
				});
				/*index.conn.query('update users set wins='+users[property].wins+', losses='+users[property].losses+', ties='+users[property].ties+' where userid = ' + users[property].id + ';', function(err, result) {
					if (err) console.log(err);
				});*/ // WILL NEED ONE TO UPDATE USERS SOON
		    }
		}
	}
}