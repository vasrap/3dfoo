// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, gfx, pools, dom, jws, map : true */

/**
 * The messaging controller.
 * Handles incoming and outgoing messages from and to the server.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
var msg = {
	// Connection established flag.
	connected : false,

	// WebSocket connection.
	connection : null,

	// While false we can't talk to the server.
	canNotify : false,
	
	// Ping related.
	latency : null,
	lastPing : null,
	
	/**
	 * Calculates client - server latency.
	 *
	 * TODO: this has to be rendering independent.
	 */
	ping : function() {
		msg.lastPing = new Date().getTime();
		
		msg.connection.pong();
	},
	
	/**
	 * Notifies server that player joined the game.
	 */
	insertPlayer : function() {
		msg.connection.insertPlayer(
			pools.oauth
		);
	},

	/**
	 * Notifies server with the new player position and rotation.
	 */
	updatePlayer : function() {
		msg.connection.updatePlayer({
			clickId:	gfx.clickId,
			position:	{x: gfx.camera.position.x.toFixed(2), 
						 y: gfx.camera.position.y.toFixed(2), 
						 z: gfx.camera.position.z.toFixed(2)},
			rotation:	{phi:	gfx.camera.phi.toFixed(2),
						 theta: gfx.camera.theta.toFixed(2)}});

		msg.canNotify = true;
	},
	
	/**
	 * Notifies server with the player's chat message.
	 */
	updateChat : function(message) {
		msg.connection.updateChat({
			message: message
		});
	},

	/**
	 * Connects to the WebSocket server and initializes connection handlers.
	 */
	init : function() {
		try {
			dom.log('Connecting to server...');
			
			// Start jWebSocket connection.
			msg.connection = new jws.jWebSocketJSONClient();
			var url = "ws://3dfoo.net:8787/";
			
			// Initializes a WebSocket connection.
			// TODO: figure out user related stuff server side.
			msg.connection.logon(url, "guest", "guest", {
				OnOpen: function(e) {
					msg.connected = true;
			
					msg.connection.startKeepAlive({interval: 30000});
					msg.connection.registerStream();

					$('#start').show();
					
					dom.log('Connected to server');
				},

				/**
				 * Message receipt rooter.
				 */
				OnMessage: function(e) {
					var data = JSON.parse(e.data);

					if (data.type === 'bcast') {
						if (gfx.engineStarted) {
							pools.updateBcast(data.message);

							gfx.updateWorld();
							map.update();
							dom.updateCharacterInfo();
						}
					} else if (data.type === 'player') {
						pools.updatePlayer(data.message);
						
						dom.updateCharacterInfo();
						msg.ping();
					} else if (data.type === 'defs') {
						pools.updateDefs(data.message);
						
						if (!gfx.engineStarted) {
							gfx.engineStarted = true;

							// Update player details.
							pools.updateMe(data.message);
							
							// Start pinging the server.
							msg.ping();

							// TODO: activate this.
							// chat.init();
							
							// Start 3D rendering and set starting position.
							gfx.init(data.message.position);

							// Start the mini map.
							map.init();
						}
					} else if (data.type === 'chat') {
						// TODO: activate this.
						// chat.updateFeed(data.message);
						
					// 'ping' action is used by the jWebSocket internals -
					// so we use 'pong'.
					} else if (data.type === 'pong') {
						msg.latency = new Date().getTime() - msg.lastPing;
					}
				},

				OnClose: function(e) {
					if (!msg.connected) {
						dom.log('Failed to connect to server!');
					} else {
						dom.log('Connection to server lost!');
					}
				}
			});
		} catch (e) {
			dom.log('Failed to connect to server!');
		}
	},
	
	shutdown : function() {
		dom.log('Disconnecting from server...');
		
		// If connections exists unregisted it and close it.
		if (msg.connection !== null) {
			msg.connection.unregisterStream();
			msg.connection.stopKeepAlive();
			msg.connection.close();
		}
	}
};
