var static = require('node-static');
var http   = require('http');
var file = new(static.Server)();
var port = 5555;

// create our webserver
var app = http.createServer(function (req, res) { file.serve(req, res); }).listen(port);
var io = require('socket.io').listen(app);

// a hash of room -> user name array
var usersGroupedByRoom = {};

io.sockets.on('connection', function(socket) {

	/*
	 socket.on('message', function (message) {
	 log('Got message:', message);

	 // for a real app, would be room only (not broadcast)
	 socket.broadcast.emit('message', message);
	 });
	 */

	socket.on("createOrJoin", function(info) {
		var room = info.room;
		var user = info.user;
		var numClients = io.sockets.clients(room).length;

		// track the users logged in each room
		if (!usersGroupedByRoom.hasOwnProperty(room)) {
			usersGroupedByRoom[room] = [];
		}
		usersGroupedByRoom[room].push(user);

		if (numClients === 0){
			socket.join(room);
			socket.emit('created', {
				room: room,
				user: user
			});
		} else if (numClients === 1) {

			// notify anyone already in the room that a new user just joined
			io.sockets.in(room).emit('otherUserJoined', {
				room: room,
				newUser: user
			});

			// now join the room and notify the new person
			socket.join(room);
			socket.emit('joined', {
				room: room,
				user: user,
				allUsers: usersGroupedByRoom[room]
			});

			// this limits it to two clients
		} else {
			socket.emit('full', room);
		}

//		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
//		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room: ' + room);
	});


	socket.on("leaveRoom", function(info) {
		socket.leave(info.room);

		// remove it from our
		var currUserIndex = usersGroupedByRoom[info.room].indexOf(info.user);
		if (currUserIndex === -1) {		// shouldn't occur
			return;
		}
		usersGroupedByRoom[info.room].splice(currUserIndex, 1);

		// check there's someone left in the room
		if (usersGroupedByRoom[info.room].length === 0) {

		} else {
			io.sockets.in(info.room).emit('userLeftRoom', {
				room: info.room,
				user: info.user,
				allUsers: usersGroupedByRoom[info.room]
			});
		}
	});


	// convenience function to log server messages on the client
	function log() {
		var array = [">>> Message from server: "];
		for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}

});