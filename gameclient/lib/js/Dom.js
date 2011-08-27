// The following line is for JSHint
/*global gfx: true, pools: true, msg: true, oauth: true */

function _Dom() {
	var self = this;

	// Window width and height.
	this.width = window.innerWidth;
	this.height = window.innerHeight;

	this.init = function() {
		$('#container').css("width", self.width + 'px');
		$('#container').css("height", self.height + 'px');
        
		$('#start').css('top', ((self.height / 2) - $('#start').height() / 2));
		$('#start').css('left', ((self.width / 2) - $('#start').width() / 2));
		$('#login').css('top', ((self.height / 2) - $('#login').height() / 2));
		$('#login').css('left', ((self.width / 2) - $('#login').width() / 2));
        
		$('#chat, #chat-wrapper').css('height', self.height);
		
		$('#start').click(function() {
			$('#container').css('background', 'none');

			gfx.startClicked = true;
			gfx.toggleActiveCamera();
			
			$(this).hide();
		});
		
		$('#login .twitter, #login .facebook').click(function() {
			oauth.get(true, $(this).attr('class'));

			$('#login').hide();
		});
		
		document.onkeydown = function(e) {
			if (e.keyCode == 9) {
				if ($('#hud-wrapper').is(':visible')) {
					$('#hud-wrapper, #hud, #fps-stats, #chat-wrapper, #chat, #logger-wrapper, #logger').hide();
				} else {
					$('#hud-wrapper, #hud, #fps-stats, #chat-wrapper, #chat, #logger-wrapper, #logger').show();
				}
				
				e.preventDefault();
				e.stopPropagation();
			}
		};
	};
	
	/**
	 * On screen logger.
	 */
	this.log = function(message) {
		$('#logger').prepend('<li>' + message + '</li>');
	};
	
	/**
	 * Update hud stats
	 */
	this.updateStats = function() {
		$('#hud-id').text('ID: ' + pools.player.id);
		$('#hud-health').text('HEALTH: ' + pools.player.health + ' / ' + pools.player.topHealth);
		$('#hud-points').text('POINTS ' + pools.player.points);
		$('#hud-damage').text('DAMAGE: ' + pools.lastDamage);
		$('#hud-locks').text('LOCKS: ' + pools.lockCount);
		$('#hud-friends').text('FRIENDS: ' + pools.allyCount);
		$('#hud-players').text('PLAYERS: ' + pools.playerCount);
		$('#hud-latency').text('LATENCY: ' + msg.latency + 'ms');
	};
}
