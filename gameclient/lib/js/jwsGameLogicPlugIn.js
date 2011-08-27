// The following line is for JSHint
/*global jws: true, pools: true */

jws.GameLogicPlugIn = {
	NS: "net.scaraveos._3dfoo.server.gamelogic",

	registerStream: function() {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "register"
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	},

	unregisterStream: function() {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "unregister",
				message: {
					// TODO: is this working ok?
					id: pools.player.id
				}
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	},
	

	pong: function() {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "pong"
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	},
	
	updateChat: function(message) {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "updateChat",
				message: message
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	},
	
	insertPlayer: function(message) {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "insertPlayer",
				message: message
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	},
	
	updatePlayer: function(message) {
		var lRes = this.createDefaultResult();
		if(this.isConnected()) {
			this.sendToken({
				ns: jws.GameLogicPlugIn.NS,
				type: "updatePlayer",
				message: message
			});
		} else {
			lRes.code = -1;
			lRes.localeKey = "jws.jsc.res.notConnected";
			lRes.msg = "Not connected.";
		}
		return lRes;
	}
};

jws.oop.addPlugIn(jws.jWebSocketTokenClient, jws.GameLogicPlugIn);
