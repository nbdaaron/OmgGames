var index = require('./index');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var games = new Array();
var ids = ["Cutie Patootie", "Chilly Nilly", "Silly Billy", "Chubby Dubby", "Little Skittle", "Teensy Weensy", "Pwnerlord", "Swagmaster", "Billybob", "Harambe"];
var users = new Array();

module.exports = {

	handle: function(req, res, io) {
		var gameID = req.query.gameID;
		if (req.query.gameID == null) {
			response.writeHead(302, {
			  'Location': '/'
			  //add other headers here...
			});
			response.end();
			return;
		}

		if (games[gameID] == null) {
			generateGame(gameID);
		}
		//console.log(index);
		//index.a();
		res.sendFile(__dirname+'/C4.html');

	},

	on: function(socket){
		socket.on('disconnect', function(msg, io) {
			disconnected(msg, io, socket);
		});
		socket.on('enterGame', function(msg, io) {
			enterGame(msg, io, socket);
		});
	},

	lobbyOn: function(socket) {
		socket.on('disconnect', function(msg, io) {
			disconnected(msg, io, socket);
		});

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
						socket: socket,
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

function generateGame(gameid) {
	games[gameid] = {
		id: gameid,
		p1: null,
		p2: null,
		spectators: new Array(),
		grid: new Array(6),
		pw: null
	};
	for (var i=0;i<6;i++) {
		grid[i] = new Array(7);
	}
}

function enterGame(msg, io, socket) {
	var gameid = msg.gameid;
	var pw = msg.pw;
	var user = getUserBySocket(socket);
	if (games[gameid] == null) {
		socket.emit("noGame", ""); //Shouldn't happen since game auto-generates if it doesn't exist.
		return;
	}
	else if (user == null) {
		socket.emit("noUser", ""); //Shoudln't happen since page auto-generates guest accounts for guests.
		return;
	}
	else if (games[gameid].pw != pw) {
		socket.emit("wrongPass", "");
		return;
	}
	var p1 = games[gameid].p1;
	var p2 = games[gameid].p2;
	if (p1 == null) {
		games[gameid].p1 = user;
		socket.emit("entered", 1);
		return;
	}
	else if (p2 == null) {
		games[gameid].p2 = user;
		socket.emit("entered", 2);
		return;
	}
	else {
		games[gameid].spectators[games[gameid].spectators.length] = user;
		socket.emit("entered", 3);
		return;
	}

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

function disconnected(msg, io, socket) {
		for (var property in users) {
		    if (users.hasOwnProperty(property)) {
		        if (users[property].socket == socket) {
		        	//console.log(users[property].name + " has disconnected from the server.");
		        	save(users[property].name, io, socket);
		        	delete users[property];
		        }
		    }
		}
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
		socket: socket,
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
	if (userExists(msg)) {
		index.conn.query('update stats set wins='+users[msg].wins+', losses='+users[msg].losses+', ties='+users[msg].ties+' where userid = ' + users[msg].id + ';', function(err, result) {
					if (err) console.log(err);
		});
	}
}

function saveAll(msg, io, socket) {
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

function getUserBySocket(socket) {
		for (var property in users) {
	    if (users.hasOwnProperty(property)) {
	        if (users[property].socket == socket) {
	        	return users[property];
	        }
	    }
	}
	return null;
}