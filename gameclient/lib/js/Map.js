// The following line is for JSHint
/*global gfx: true, pools: true */

function _Map() {
	var self = this;

	this.mapWidth = $('#map').width();
	this.mapHeight = $('#map').height();

	/**
	 * Updates the mini map.
	 */
	this.update = function() {		
		var scaleFactorWidth = this.mapWidth / gfx.landSize;
		var scaleFactorHeight = this.mapHeight / gfx.landSize;
		
		for (var id in pools.players) {
			if (pools.defs.players[id]) {
				var data = pools.players[id];

				if (document.getElementById('map-' + id) === null) {
					var playerType = pools.defs.players[id].type;
					if (id == pools.player.id) playerType = 'me';

					$('#map').append('<div id="map-' + id + '" class="map-dot map-type-' + playerType + '"> </div>');
				}

				$('#map-' + id).css('top', (self.mapHeight / 2) + (data.position.x * scaleFactorHeight));
				$('#map-' + id).css('right', (self.mapWidth / 2) + (data.position.z * scaleFactorWidth));
			}
		}
	};
}
