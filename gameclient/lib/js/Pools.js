// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, gfx : true */

/**
 * The pools container.
 * Contains definitions and updates for players and addons.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
var pools = {
	oauth : {
		oauthNetwork: '',
		oauthToken: '',
		oauthTokenSecret: ''
	},
	
	player : {
		id: 0,
		name: '',
		picture: '',
		health: 0,
		topHealth: 0,
		points: 0,
		addons: [],
		damage: [],
		locks: []
	},
	
	players : [],
	beams : [],
	addons : [],
	
	defs : {
		players: [],
		addons: [],
		position: []
	},
	
	lastHealth : null,

	updateMe : function(message) {
		pools.player.id = message.me.id;
		pools.player.name = message.me.name;
		pools.player.picture = message.me.picture;

		// TODO: this has to go in Dom.js
		$('#char-portrait img').attr('src', pools.player.picture);
	},
	
	updatePlayer : function(message) {
		pools.player.health = message.health;
		pools.player.topHealth = message.topHealth;
		pools.player.points = message.points;
		pools.player.addons = message.addons;
		pools.player.damage = message.damage;
		pools.player.locks = message.locks;
		
		if (pools.lastHealth !== pools.player.health && pools.lastHealth !== null) {
			if (pools.player.health === 0) {
				gfx.deadEffect();
			} else {
				if (pools.lastHealth === 0) {
					gfx.cameraActive();
				}
				gfx.damageEffect();
			}
		}
		
		pools.lastHealth = pools.player.health;
	},
	
	updateBcast : function(message) {
		pools.players = message.players;
		pools.beams = message.beams;
		pools.addons = message.addons;
	},
	
	updateDefs : function(message) {
		pools.defs.players = message.players;
		pools.defs.addons = message.addons;
		pools.defs.position = message.position;
	}
};
