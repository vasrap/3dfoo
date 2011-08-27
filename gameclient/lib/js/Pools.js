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
	
	this.allyCount = 0;
	this.playerCount = 0;
	this.lockCount = 0;
	this.lastDamage = 0;
	this.lastHealth = null;

	this.updateMe = function(message) {
		self.player.id = message.me.id;
		self.player.name = message.me.name;
	};
	
	this.updatePlayer = function(message) {
		self.player.health = message.health;
		self.player.topHealth = message.topHealth;
		self.player.points = message.points;
		self.player.addons = message.addons;
		self.player.damage = message.damage;
		self.player.locks = message.locks;
		
		self.lockCount = 0;
		for (var lid in self.player.locks) {
			self.lockCount++;
		}
		
		self.lastDamage = 0;
		for (var did in self.player.damage) {
			self.lastDamage = self.player.damage[did].toFixed(2);
		}
		
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
		
		self.allyCount = self.playerCount = 0;
		for(var pid in self.defs.players) {
			if (self.defs.players[pid].type == 'ally') {
				self.allyCount++;
			}
		
			self.playerCount++;
		}
	};
}
