// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, chat, gfx, map, msg, oauth, pools, utils : true */

/**
 * General DOM manipulation utils.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
var dom = {
	// Window width and height.
	width : window.innerWidth,
	height : window.innerHeight,

	// Logger hidden state.
	loggerHidden : true,

	// DOM elements.
	charLifeValueEl : null,
	charLifeBarEl : null,
	charPointsValueEl : null,
	charPowerValueEl : null,
	charShieldValueEl : null,

	init : function () {
		dom.charLifeValueEl = document.getElementById('char-life-value');
		dom.charLifeBarEl = document.getElementById('char-life-bar');
		dom.charPointsValueEl = document.getElementById('char-points-value');
		dom.charPowerValueEl = document.getElementById('char-power-value');
		dom.charShieldValueEl = document.getElementById('char-shield-value');

		var startEl = $('#start');
		var loginEl = $('#login');

		// Center HTML elements.
		startEl.css('top', ((dom.height / 2) - startEl.height() / 2));
		startEl.css('left', ((dom.width / 2) - startEl.width() / 2));
		loginEl.css('top', ((dom.height / 2) - loginEl.height() / 2));
		loginEl.css('left', ((dom.width / 2) - loginEl.width() / 2));
        
		// Click handler for START button.
		startEl.click(function () {
			// Switch to in game CSS.
			$('#container').css({background: 'none'});
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
		$('#login .twitter, #login .facebook').click(function () {
			// Start oauth process.
			oauth.get(true, $(this).attr('class'));
			
			loginEl.hide();
		});

		// Disable onmousedown event when mouse is over the HUD.
		document.getElementById('hud').onmousedown = function (e) {
			e.preventDefault();
			e.stopPropagation();
		};
		
		document.onkeyup = function (e) {
			// Create references for use inside the local scope (faster look-up).
			var loginEl = $('#login');

			// Catch tab key up event and stop it from propagating.
			// Toggles logger visibility.
			if (e.keyCode === 9) {
				if (loginEl.is(':visible')) {
					loginEl.hide();
				} else {
					loginEl.show();
				}
				
				e.preventDefault();
				e.stopPropagation();
			}
		};
	},
	
	/**
	 * Logger.
	 *
	 * TODO: remove jquery animation, use CSS3 animations.
	 */
	log : function (message) {
		var loggerEl = $('#logger');

		var date = new Date();
		var hours = (date.getHours() >= 10) ? date.getHours() : '0' + date.getHours();
		var minutes = (date.getMinutes() >= 10) ? date.getMinutes() : '0' + date.getMinutes();
		var seconds = (date.getSeconds() >= 10) ? date.getSeconds() : '0' + date.getSeconds();
		var dateString = hours + ':' + minutes + ':' + seconds;

		loggerEl.append('<li> [' + dateString + '] '  + message + '</li>');
		
		if (dom.loggerHidden) {
			dom.loggerHidden = false;
			loggerEl.animate({height: '97px'}, 100, 'linear', function () {
				
				loggerEl.scrollTop(100000);
				
				loggerEl.animate({height: '97px'}, 2700, 'linear', function () {
					loggerEl.animate({height: '0px'}, 100, 'linear', function () {
						dom.loggerHidden = true;
						
						loggerEl.scrollTop(100000);
					});
				});
			});
		} 
	},
	
	/**
	 * Update character info.
	 */
	updateCharacterInfo : function () {
		var playerHealth = pools.player.health;
		var playerTopHealth = pools.player.topHealth;
		var playerPoints = pools.player.points;

		// Calculate health percentage.
		var healthPercentage = playerHealth / playerTopHealth * 100;
		
		// Update DOM elements.
		this.charLifeValueEl.innerHTML = playerHealth + ' / ' + playerTopHealth;
		this.charLifeBarEl.style.width = healthPercentage.toString() + '%';
		this.charPointsValueEl.innerHTML = playerPoints;

		// Those are not yet available and they are always 0%.
		this.charPowerValueEl.innerHTML = '0%';
		this.charShieldValueEl.innerHTML = '0%';
	}
};
