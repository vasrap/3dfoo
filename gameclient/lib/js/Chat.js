// The following line is for JSHint
/*global gfx: true, pools: true, msg: true */

// TODO: make chat more user friendly
function _Chat() {
	var self = this;
	
	/**
	 * Initialized mouse / keyboard interaction handlers.
	 */
	this.init = function() {
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
			if (e.keyCode == 13) {
				if ($('#chat-text').val().trim() !== '') {

					msg.updateChat($('#chat-text').val());
					self.updateFeed({message: $('#chat-text').val()});

					$('#chat-text').val('');
				}
			} else {
				e.stopPropagation();
			}
		};
	};
	
	/**
	 * Updates the chat feed.
	 */
	this.updateFeed = function(message) {
		var data = message;
		
		var name = 'me';
		if (data.id && data.id != pools.player.id) {
			name = pools.defs.players[data.id].name;
		}
		
		$('#chat').prepend('<li>' + name + ':<br />' + data.message);
	};
}

var chat = new _Chat();
