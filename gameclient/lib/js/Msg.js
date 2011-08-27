// The following line is for JSHint
/*global pools: true, gfx: true, dom: true, jws: true, map: true, chat: true */

function _Msg() {
	var self = this;

	// Connection flag.
	this.connected = false;

	// WebSocket connection.
	this.connection = null;

	// While false we can't talk to the server.
	this.canNotify = false;
	
	// Messaging interval every second,
	// i.e. how many times a second.
	this.interval = 20;
	
	// Ping related.
	this.latency = null;
	this.lastPing = null;
	
	this.ping = function() {
		self.lastPing = new Date().getTime();
		
		self.connection.pong();
	};
	
	/**
	 * Initiates player on server.
	 */
	this.insertPlayer = function() {
		self.connection.insertPlayer(
			pools.oauth
		);
	};

	/**
	 * Notifies the server with the new camera position.
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
	 * Notifies the server with the user's chat message.
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
			
			self.connection = new jws.jWebSocketJSONClient();

			var lURL = "ws://3dfoo.net:8787/";
			
			// Initializes a WebSocket connection.
			self.connection.logon(lURL, "guest", "guest", {
				/**
				 * On WebSocket open, run the init() method to kickstart the -
				 * 3D environment.
				 */
				OnOpen: function(e) {
					self.connected = true;
			
					self.connection.startKeepAlive({interval: 30000});
					self.connection.registerStream();
					
					dom.log('Connected to server');

					self.insertPlayer();
				},

				/**
				 * On message receipt update pools or chat.
				 */
				OnMessage: function(e) {
					var data = JSON.parse(e.data);

					if (data.type == 'bcast') {
						pools.updateBcast(data.message);

						gfx.updateWorld();
						map.update();
						dom.updateStats();
					} else if (data.type == 'player') {
						pools.updatePlayer(data.message);
						
						dom.updateStats();
						self.ping();
					} else if (data.type == 'defs') {
						pools.updateDefs(data.message);
						
						if (!gfx.started) {
							pools.updateMe(data.message);
							self.ping();
							chat.init();
							gfx.init(data.message.position);
						}
						
						dom.updateStats();
					} else if (data.type == 'chat') {
						chat.updateFeed(data.message);
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
		
		if (self.connection !== null) {
			self.connection.unregisterStream();
			self.connection.stopKeepAlive();
			self.connection.close();
		}
	};
}
