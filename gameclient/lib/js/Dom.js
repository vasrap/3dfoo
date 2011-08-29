// The following line is for JSHint
/*global gfx: true, pools: true, msg: true, oauth: true */

function _Dom() {
	var self = this;

	// Window width and height.
	this.width = window.innerWidth;
	this.height = window.innerHeight;

	this.init = function() {
		// Center HTML elements.
		$('#container').css("width", self.width + 'px');
		$('#container').css("height", self.height + 'px');
		$('#hud').css('left', ((self.width / 2) - $('#hud').width() / 2));
		$('#logger').css('left', ((self.width / 2) - $('#logger').width() / 2));
		$('#start').css('top', ((self.height / 2) - $('#start').height() / 2));
		$('#start').css('left', ((self.width / 2) - $('#start').width() / 2));
		$('#login').css('top', ((self.height / 2) - $('#login').height() / 2));
		$('#login').css('left', ((self.width / 2) - $('#login').width() / 2));
        
		// What to do when the user clicks START.
		$('#start').click(function() {
			// Switch to in game CSS.
			$('#container').css('background', 'none');
			$('#overlay').css({background: 'none', opacity: 1, 'z-index': 0});

			// This flag allows client to start transmiting data.
			gfx.startClicked = true;

			// Start transmiting data to the server.
			msg.canNotify = true;
			
			// Notify server of player existence.
			msg.insertPlayer();
			
			$(this).hide();
		});
		
		// Click handler for login buttons.
		$('#login .twitter, #login .facebook').click(function() {
			// Start oauth process.
			oauth.get(true, $(this).attr('class'));
			
			$('#login').hide();
		});

		// Disable onmousedown event when mouse is over the HUD.
		document.getElementById('hud').onmousedown = function(e) {
			e.preventDefault();
			e.stopPropagation();
		};
		
		document.onkeyup = function(e) {
			// Catch tab key up event and stop it from propagating.
			// Toggles logger visibility.
			if (e.keyCode == 9) {
				if ($('#logger').is(':visible')) {
					$('#logger').hide();
				} else {
					$('#logger').show();
				}
				
				e.preventDefault();
				e.stopPropagation();
			}
		};
	};
	
	/**
	 * Logger.
	 */
	this.loggerHidden = true;
	this.log = function(message) {
		var date = new Date();
		hours = (date.getHours() >= 10) ? date.getHours() : '0' + date.getHours();
		minutes = (date.getMinutes() >= 10) ? date.getMinutes() : '0' + date.getMinutes();
		seconds = (date.getSeconds() >= 10) ? date.getSeconds() : '0' + date.getSeconds();
		dateString = hours + ':' + minutes + ':' + seconds;

		$('#logger').append('<li> [' + dateString + '] '  + message + '</li>');
		
		if (self.loggerHidden) {
			self.loggerHidden = false;
			$('#logger').animate({height: '97px'}, 100, 'linear', function() {
				
				$('#logger').scrollTop(100000);
				
				$('#logger').animate({height: '97px'}, 2700, 'linear', function() {
					$('#logger').animate({height: '0px'}, 100, 'linear', function() {
						self.loggerHidden = true;
						
						$('#logger').scrollTop(100000);
					});
				});
			});
		} 
	};
	
	/**
	 * Update character info.
	 */
	this.updateCharacterInfo = function() {
		// Calculate health percentage.
		var healthPercentage = pools.player.health / pools.player.topHealth * 100;
		
		$('#char-life .value').text(pools.player.health + ' / ' + pools.player.topHealth);
		$('#char-life-bar').css('width', healthPercentage + '%');
		$('#char-points .value').text(pools.player.points);

		// Those are not yet available and they are always 0%.
		$('#char-power .value').text('0%');
		$('#char-shield .value').text('0%');
	};
}
