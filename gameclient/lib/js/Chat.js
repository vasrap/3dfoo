// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, gfx, pools, msg : true */

/**
 * The chat controller.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 *
 *TODO: make chat more user friendly
 */
var chat = {
	/**
	 * Initialized mouse / keyboard interaction handlers.
	 */
	init : function() {
		document.getElementById('chat-text').onmouseover = function(e) {
			gfx.toggleActiveCamera();
		};

		document.getElementById('chat-text').onmouseout = function(e) {
			gfx.toggleActiveCamera();

			$('#chat-text').val('');
			this.blur();
		};

		document.getElementById('chat-text').onmousedown = function(e) {
			this.focus();
		};

		document.getElementById('chat-text').onkeydown = function(e) {
			if (e.keyCode === 13) {
				if ($('#chat-text').val().trim() !== '') {

					msg.updateChat($('#chat-text').val());
					chat.updateFeed({message: $('#chat-text').val()});

					$('#chat-text').val('');
				}
			} else {
				e.stopPropagation();
			}
		};
	},
	
	/**
	 * Updates the chat feed.
	 */
	updateFeed : function(message) {
		var data = message;
		
		var name = 'me';
		if (data.id && data.id !== pools.player.id) {
			name = pools.defs.players[data.id].name;
		}
		
		$('#chat').prepend('<li>' + name + ':<br />' + data.message);
	}
};
