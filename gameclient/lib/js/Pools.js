// The following line is for JSHint
/*global gfx: true */

function _Pools() {
	var self = this;

	this.oauth = {
		oauthNetwork: '',
		oauthToken: '',
		oauthTokenSecret: ''
	};
	
	this.player = {
		id: 0,
		name: '',
		picture: '',
		health: 0,
		topHealth: 0,
		points: 0,
		addons: [],
		damage: [],
		locks: []
	};
	
	this.players = [];
	this.beams = [];
	this.addons = [];
	
	this.defs = {
		players: [],
		addons: [],
		position: []
	};
	
	this.lastHealth = null;

	this.updateMe = function(message) {
		self.player.id = message.me.id;
		self.player.name = message.me.name;
		self.player.picture = message.me.picture;

		// TODO: this has to go in Dom.js
		$('#char-portrait img').attr('src', self.player.picture);
	};
	
	this.updatePlayer = function(message) {
		self.player.health = message.health;
		self.player.topHealth = message.topHealth;
		self.player.points = message.points;
		self.player.addons = message.addons;
		self.player.damage = message.damage;
		self.player.locks = message.locks;
		
		if (self.lastHealth != self.player.health && self.lastHealth !== null) {
			if (self.player.health === 0) {
				gfx.deadEffect();
			} else {
				gfx.damageEffect();
			}
		}
		
		self.lastHealth = self.player.health;
	};
	
	this.updateBcast = function(message) {
		self.players = message.players;
		self.beams = message.beams;
		self.addons = message.addons;
	};
	
	this.updateDefs = function(message) {
		self.defs.players = message.players;
		self.defs.addons = message.addons;
		self.defs.position = message.position;
	};
}
