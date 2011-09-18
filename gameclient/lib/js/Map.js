// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, gfx, pools : true */

/**
 * The map controller.
 * Handles player entities on within map area.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
var map = {
	// Map dimensions.
	mapWidth : $('#map').width(),
	mapHeight : $('#map').height(),
	
	// Helper variables.
	el : {},
	scaleFactorWidth : null,
	scaleFactorHeight : null,
	halfMapWidth : null,
	halfMapHeight : null,
	mapWidthM5 : null,
	mapHeightM5 : null,
	
	init : function() {
		var mapWidth = map.mapWidth;
		var mapHeight = map.mapHeight;

		// Calculate helper variables once.
		map.scaleFactorWidth = mapWidth / gfx.landSize;
		map.scaleFactorHeight = mapHeight / gfx.landSize;
		map.halfMapWidth = mapWidth / 2;
		map.halfMapHeight = mapHeight / 2;
		map.mapWidthM5 = mapWidth - 5;
		map.mapHeightM5 = mapHeight - 5;

		/**
		 * Toggle specific player type visibility in the map.
		 * (ie. weaks, ghosts, etc).
		 */
		$('#map-togglers div').click(function(e) {
			if ($('#map .' + $(this).attr('class') + ':first').is(':visible')) {
				$('#map .' + $(this).attr('class')).hide();
			} else {
				$('#map .' + $(this).attr('class')).show();
			}
			
			e.preventDefault();
			e.stopPropagation();
		});
	},

	/**
	 * Updates player positions and types on the map.
	 */
	update : function() {
		for (var id in pools.players) {
			if (pools.players.hasOwnProperty(id)) {
				var playerInfo = pools.players[id];
				var playerDef = pools.defs.players[id];

				if (playerInfo && playerDef) {
					// Set or change player type.
					var playerType = playerDef.type;
					if (id === pools.player.id) playerType = 'me';
					if (this.el[id] === undefined) {
						$('#map').append('<div id="map-' + id + '" class="map-dot map-type-' + playerType + '"> </div>');
						this.el[id.toString()] = document.getElementById('map-' + id);
					} else {
						this.el[id.toString()].class = 'map-dot map-type-' + playerType;
					}
					
					// Calculate player position on the this.
					var topPos = this.halfMapHeight + (playerInfo.position.x * this.scaleFactorHeight);
					var rightPos = this.halfMapWidth + (playerInfo.position.z * this.scaleFactorWidth);

					// Don't let the player dot to drift outside the this.
					if (topPos > this.thisHeightM5) topPos = this.thisHeightM5;
					if (rightPos > this.thisWidthM5) rightPos = this.thisWidthM5;
					if (topPos < 0) topPos = 0;
					if (rightPos < 0) rightPos = 0;

					// Set player position on the this.
					this.el[id].style.top = topPos;
					this.el[id].style.right = rightPos;
				}
			}
		}
	},

	/**
	 * Removes player from map.
	 */
	remove : function(id) {
		$('#map-' + id).remove();
	}
};
