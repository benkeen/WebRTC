(function() {
	"use strict";

	var _socket = io.connect();
	var _isInitiator;
	var _roomName;
	var _userName;
	var _peopleOnline = [];

	var _init = function() {
		$("#joinRoom").on("click", function() {
			_roomName = $("#roomName").val();
			_userName = $("#userName").val();

			if (_roomName !== "") {
				_socket.emit("createOrJoin", {
					room: _roomName,
					user: _userName
				});
				_peopleOnline.push(_userName);
				_updatePeopleOnline();

				// not really the right place for it... should wait for confirmation from server
				$("#joinRoom").addClass("hidden");
				$("#leaveRoom").removeClass("hidden");
			}
		});

		$("#leaveRoom").on("click", function() {
			_socket.emit("leaveRoom", {
				room: _roomName,
				user: _userName
			});
			$("#joinRoom").removeClass("hidden");
			$("#leaveRoom").addClass("hidden");
		});
	};

	_socket.on("full", function(room) {
		console.log('Room ' + room + ' is full');
	});

	_socket.on("empty", function(room) {
		_isInitiator = true;
		console.log('Room ' + room + ' is empty');
	});

	/**
	 * This is called whenever someone NEW joins the room. It's only sent to people who
	 * are already in the room - not the new guy/gal/bot/cephalopod.
	 */
	_socket.on("otherUserJoined", function(data) {
		_peopleOnline.push(data.newUser);
		_updatePeopleOnline();
	});

	/**
	 * Called when the current user joins a room. Only called for that single person, and NOT
	 * called for the initiator.
	 */
	_socket.on("joined", function(data) {
		_peopleOnline = data.allUsers;

		console.log("I just joined: ", data);
		_updatePeopleOnline();
	});

	_socket.on("userLeftRoom", function(data) {
		_peopleOnline = data.allUsers;
		console.log("This user just left the room: ", data.user);
		_updatePeopleOnline();
	});

	/**
	 * Helper function to display messages from the server.
	 */
	_socket.on("log", function(array) {
		console.log.apply(console, array);
	});

	var _updatePeopleOnline = function() {
		$("#people").html(_peopleOnline.join(", "));
		$("#peopleInRoom").removeClass("hidden");
	};

	_init();

})();
