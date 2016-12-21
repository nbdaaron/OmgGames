var index = require('./index');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var games = new Array();
var ids = ["Cute Bunny", "Chilly Billy", "Silly Willy", "Chubby Dubby", "Little Skittle", "Teensy Weensy", "Pwnerlord", "Swagmaster", "Billybob", "Harambe"];
var users = new Array();

module.exports = {

	handle: function(req, res, io) {
		res.sendFile(__dirname+'/C4.html');
	},

	on: function(socket){
		socket.on('disconnect', disconnected);
	},

	lobbyOn: function(socket) {
		socket.on('disconnect', disconnected);
		socket.on('generateGame', generateGame);
		socket.on('generateUser', 	function generateUser(msg, io) {
			var id;
			do {
				id = ids[parseInt(Math.random() * ids.length)];
			} while (userExists(id));

			users[id] = {
				name: id,
				wins: 0,
				losses: 0, 
				ties: 0
			};
			socket.emit("userMade", id);
		});
		socket.on('getStats', 	function getStats(msg, io) {
			if (userExists(msg)) {
				socket.emit("stats", {
					wins: users[msg].wins,
					losses: users[msg].losses,
					ties: users[msg].ties
				});
			}
			//return null;
	});
	}

};

	function received(msg, io) {
		console.log(msg);
	}

	function generateGame(msg, io) {
		
	}






	function userExists(id) {
		console.log(id);
		console.log(users);
		console.log(users[id]);
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