// The following line is for JSHint
/*global gfx: true, pools: true */

function _Map() {
	var self = this;

	// Map dimensions.
	this.mapWidth = $('#map').width();
	this.mapHeight = $('#map').height();
	
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

	/**
	 * Updates player positions and types on the map.
	 */
	this.update = function() {
		// Calculate the 3D land plane - map size scale factor.		
		var scaleFactorWidth = this.mapWidth / gfx.landSize;
		var scaleFactorHeight = this.mapHeight / gfx.landSize;
		
		for (var id in pools.players) {
			// TODO: do we need this if statement?
			if (pools.defs.players[id]) {
				var data = pools.players[id];

				// Set or change player type.
				var playerType = pools.defs.players[id].type;
				if (id == pools.player.id) playerType = 'me';
				if (document.getElementById('map-' + id) === null) {
					$('#map').append('<div id="map-' + id + '" class="map-dot map-type-' + playerType + '"> </div>');
				} else if ($('#map-' + id).attr('class') !== ('map-dot map-type-' + playerType)) {
					$('#map-' + id).attr('class', 'map-dot map-type-' + playerType);
				}
				
				// Calculate player position on the map.
				var topPos = (self.mapHeight / 2) + (data.position.x * scaleFactorHeight);
				var rightPos = (self.mapWidth / 2) + (data.position.z * scaleFactorWidth);
				if (topPos + 5 > this.mapHeight) topPos = this.mapHeight - 5;
				if (rightPos + 5 > this.mapWidth) rightPos = this.mapWidth - 5;

				// Don't let the player dot to drift outside the map.
				if (topPos < 0) topPos = 0;
				if (rightPos < 0) rightPos = 0;

				// Set player position on the map.
				$('#map-' + id).css('top', topPos);
				$('#map-' + id).css('right', rightPos);
			}
		}
	};

	/**
	 * Removes player from map.
	 */
	this.remove = function(id) {
		$('#map-' + id).remove();
			
	};
}

var map = new _Map();
