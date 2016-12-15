var index = require('./index');
var express = require('express');
var app = express();
var http = require('http').Server(app);

module.exports = {

	handle: function(req, res, io) {
		res.sendFile(__dirname+'/C4.html');

	},

	on: function(socket){
		socket.on('disconnect', disconnected);
	}

};

	function received(msg, io) {
		console.log(msg);
	}

	function disconnected(msg) {
		console.log("User disconnected");
	}