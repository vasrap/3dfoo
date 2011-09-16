// The following line is for JSHint
/*global jws, pools: true */

/**
 * The client side jWebSocket plugin.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
jws.GameLogicPlugIn = {
	NS: "net.scaraveos._3dfoo.server.gamelogic",

	registerStream: function() {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "register"
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	},

	unregisterStream: function() {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "unregister",
				message: {}
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	},

	pong: function() {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "pong"
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	},
	
	updateChat: function(message) {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "updateChat",
				message: message
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	},
	
	insertPlayer: function(message) {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "insertPlayer",
				message: message
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	},
	
	updatePlayer: function(message) {
		var result = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "updatePlayer",
				message: message
			});
		} else {
			result.code = -1;
			result.localeKey = "jws.jsc.res.notConnected";
			result.msg = "Not connected.";
		}
		return result;
	}
};

jws.oop.addPlugIn(jws.jWebSocketTokenClient, jws.GameLogicPlugIn);
