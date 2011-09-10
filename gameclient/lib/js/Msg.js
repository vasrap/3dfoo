// The following line is for JSHint
/*global pools: true, gfx: true, dom: true, jws: true, map: true, chat: true */

function _Msg() {
	var self = this;

	// Connection established flag.
	this.connected = false;

	// WebSocket connection.
	this.connection = null;

	// While false we can't talk to the server.
	this.canNotify = false;
	
	// Ping related.
	this.latency = null;
	this.lastPing = null;
	
	/**
	 * Calculates client - server latency.
	 *
	 * TODO: this has to be rendering independent.
	 */
	this.ping = function() {
		self.lastPing = new Date().getTime();
		
		self.connection.pong();
	};
	
	/**
	 * Notifies server that player joined the game.
	 */
	this.insertPlayer = function() {
		self.connection.insertPlayer(
			pools.oauth
		);
	};

	/**
	 * Notifies server with the new player position and rotation.
	 */
	this.updatePlayer = function() {
		self.connection.updatePlayer({
			clickId:	gfx.clickId,
			position:	{x: gfx.camera.position.x.toFixed(2), 
						 y: gfx.camera.position.y.toFixed(2), 
						 z: gfx.camera.position.z.toFixed(2)},
			rotation:	{phi:	gfx.camera.phi.toFixed(2),
						 theta: gfx.camera.theta.toFixed(2)}});

		self.canNotify = true;
	};
	
	/**
	 * Notifies server with the player's chat message.
	 */
	this.updateChat = function(message) {
		self.connection.updateChat({
			message: message
		});
	};

	/**
	 * Connects to the WebSocket server and initializes connection handlers.
	 */
	this.init = function() {
		try {
			dom.log('Connecting to server...');
			
			// Start jWebSocket connection.
			self.connection = new jws.jWebSocketJSONClient();
			var url = "ws://3dfoo.net:8787/";
			
			// Initializes a WebSocket connection.
			// TODO: figure out user related stuff server side.
			self.connection.logon(url, "guest", "guest", {
				OnOpen: function(e) {
					self.connected = true;
			
					self.connection.startKeepAlive({interval: 30000});
					self.connection.registerStream();

					$('#start').show();
					
					dom.log('Connected to server');
				},

				/**
				 * Message receipt rooter.
				 */
				OnMessage: function(e) {
					var data = JSON.parse(e.data);

					if (data.type == 'bcast') {
						pools.updateBcast(data.message);

						gfx.updateWorld();
						map.update();
						dom.updateCharacterInfo();
					} else if (data.type == 'player') {
						pools.updatePlayer(data.message);
						
						dom.updateCharacterInfo();
						self.ping();
					} else if (data.type == 'defs') {
						pools.updateDefs(data.message);
						
						if (!gfx.engineStarted) {
							gfx.engineStarted = true;

							// Update player details.
							pools.updateMe(data.message);
							
							// Start pinging the server.
							self.ping();

							// TODO: activate this.
							// chat.init();
							
							// Start 3D rendering and set starting position.
							gfx.init(data.message.position);
						}
					} else if (data.type == 'chat') {
						// TODO: activate this.
						// chat.updateFeed(data.message);
						
					// 'ping' action is used by the jWebSocket internals -
					// so we use 'pong'.
					} else if (data.type == 'pong') {
						self.latency = new Date().getTime() - self.lastPing;
					}
				},

				OnClose: function(e) {
					if (!self.connected) {
						dom.log('Failed to connect to server!');
					} else {
						dom.log('Connection to server lost!');
					}
				}
			});
		} catch (e) {
			dom.log('Failed to connect to server!');
		}
	};
	
	this.shutdown = function() {
		dom.log('Disconnecting from server...');
		
		// If connections exists unregisted it and close it.
		if (self.connection !== null) {
			self.connection.unregisterStream();
			self.connection.stopKeepAlive();
			self.connection.close();
		}
	};
}

var msg = new _Msg();
