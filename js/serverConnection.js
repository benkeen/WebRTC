(function() {
	"use strict";

	var _socket = io.connect();
	var _isInitiator;
	var _roomName;
	var _userName;
	var _peopleOnline = [];

	var _init = function() {
		_addGeneralEventHandlers();
		_addTextConversationEventHandlers();
	};

	var _addGeneralEventHandlers = function() {
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

	var _addTextConversationEventHandlers = function() {
		$("#sendMessage").on("click", function() {
			var message = $("#message").val();
			_sendMessage(message);
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


	// ----------------------------------------------------------------------------------------------------------

	// TEXT conversation through WebRTC

	var _sendMessage = function(message) {
		_socket.emit("message", {
			room: _roomName,
			user: _userName,
			message: message
		});
	};

	_socket.on("message", function(message){
		console.log('Received message... still from server at this point', message);

		/*

		// seems to be audio or video
		if (message === 'got user media') {
			maybeStart();


		} else if (message.type === 'offer') {
			if (!isInitiator && !isStarted) {
				maybeStart();
			}
			pc.setRemoteDescription(new RTCSessionDescription(message));
			doAnswer();
		} else if (message.type === 'answer' && isStarted) {
			pc.setRemoteDescription(new RTCSessionDescription(message));
		} else if (message.type === 'candidate' && isStarted) {
			var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
				candidate:message.candidate});
			pc.addIceCandidate(candidate);
		} else if (message === 'bye' && isStarted) {
			handleRemoteHangup();
		}
		*/
	});

	var _maybeStart = function() {

	};

	var _createPeerConnection = function() {
		try {
			pc = new RTCPeerConnection(pc_config, pc_constraints);
			pc.onicecandidate = handleIceCandidate;
			console.log('Created RTCPeerConnnection with:\n' +
				'  config: \'' + JSON.stringify(pc_config) + '\';\n' +
				'  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
		} catch (e) {
			console.log('Failed to create PeerConnection, exception: ' + e.message);
			alert('Cannot create RTCPeerConnection object.');
			return;
		}
		pc.onaddstream    = handleRemoteStreamAdded;
		pc.onremovestream = handleRemoteStreamRemoved;

		if (isInitiator) {
			try {
				// Reliable Data Channels not yet supported in Chrome
				sendChannel = pc.createDataChannel("sendDataChannel",
					{reliable: false});
				trace('Created send data channel');
			} catch (e) {
				alert('Failed to create data channel. ' +
					'You need Chrome M25 or later with RtpDataChannel enabled');
				trace('createDataChannel() failed with exception: ' + e.message);
			}
			sendChannel.onopen = handleSendChannelStateChange;
			sendChannel.onclose = handleSendChannelStateChange;
		} else {
			pc.ondatachannel = gotReceiveChannel;
		}
	}


	// ----------------------------------------------------------------------------------------------------------


	_init();

})();
