// The following line is for JSHint
/*global oauth: true, dom: true, pools: true, msg: true */

function _Oauth() {
	var self = this;

	// Count after 3 then stop trying to access the rest service.
	this.retryCount = 0;

	// Generate oauth url method.
	this.url = function(network) {
		if (network === undefined) return 0;

		return '/rest/service.py/oauth-' + network + '/';
	};

	// Figure out what to do regarding the oauth process.
	this.router = function() {
		var urlParams = $(location).attr('search');
		
		if (urlParams.indexOf('oauth=twitter') != -1) {
			oauth.get(false, 'twitter');
		} else if (urlParams.indexOf('oauth=facebook') != -1) {
			oauth.get(false, 'facebook');
		} else {
			$('#login').show();
		}
	};

	// Defines the client side oauth process.
	this.get = function(userAction, network) {
		if (userAction === undefined) return 0;

		var urlParams = $(location).attr('search');

		// If we came back from authorize url.
		if (
			// Twitter
			(urlParams.indexOf('oauth=twitter') && 
			urlParams.indexOf('oauth_token=') != -1 && 
			urlParams.indexOf('oauth_verifier=') != -1) ||
			// Facebook
			(urlParams.indexOf('oauth=facebook') && 
			urlParams.indexOf('code=') != -1))
		{
			$.get(self.url(network) + '2' + urlParams, function(data) {
				self.retryCount++;

				if (!data.error) {
					window.location = '/?oauth=' + network;
				} else {
					if (self.retryCount <= 3) {
						self.get();
					} else {
						dom.userError('Couldn\'t contact Twitter. Please, try again later.');
					}
				}
			}, 'json');

		// If user just visited 3dfoo or if we have oauth data in session.
		} else {
			$.get(self.url(network) + '9', function(data) {
				// If oauth details in session.
				if (!data.error) {
					pools.oauth = {
						oauthNetwork: data.oauth_network,
						oauthToken: data.oauth_token,
						oauthTokenSecret: data.oauth_token_secret
					};

					// Now that we have the oauth data, we can start -
					// the messaging instance.
					msg.init();

				// If oauth details not found.
				} else {
					// If user triggered a login action.
					if (userAction) {
						// Ask the rest service what's the authorize url.
						$.get(self.url(network) + '1', function(data) {
							self.retryCount++;

							if (!data.error) {
								window.location = data.authorize_url;
							} else {
								if (self.retryCount <= 3) {
									self.get();
								} else {
									dom.userError('Couldn\t contact oauth service. Please, try again later.');
								}
							}
						}, 'json');
					} else {
						$('#login').show();
					}
				}
			}, 'json');
		}
	};
}
