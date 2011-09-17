"""
Facebook specific logic.
"""

import urlparse
import urllib
import httplib
import json

class oauth(object):
	"""
	The oauth object knows how to authorize a Facebook user.
	"""

	api_key = ''
	api_secret = ''
	
	graph_url = 'graph.facebook.com'
	oauth_suburl = '/oauth/access_token'
	me_suburl = '/me'

	authorize_url = 'https://www.facebook.com/dialog/oauth'
	redirect_url = 'http://3dfoo.net/?oauth=facebook'

	session = 0

	def __init__(self, session):
		self.session = session

	def testToken(self):
		"""
		- Tests if the saved token is still valid.
		- Returns the token if valid.
		"""

		if self.session.oauth_network == 'facebook' and self.session.oauth_token != '':
			conn = httplib.HTTPSConnection(self.graph_url)
			
			conn.request('GET',
				self.me_suburl + 
				'?access_token=' + self.session.oauth_token) 

			resp = conn.getresponse()
			content = json.loads(resp.read())
			
			if resp.status != 200 or 'error' in content:
				return {'error': True}
			
			response = {
				'oauth_network': 'facebook', 
				'oauth_token': self.session.oauth_token,
				'oauth_token_secret': self.session.oauth_token_secret,
				'error': False}

			return response
		else:
			return {'error': True}

	def request(self):
		""" Builds the authorization url. """

		self.session.oauth_network = 'facebook'
		self.session.oauth_token_secret = 'n/a'
		
		return {
			'authorize_url': 
				self.authorize_url + 
				'?client_id=' + self.api_key + 
				'&redirect_uri=' + self.redirect_url, 
			'error': False}

	def access(self, authorize_params_str):
		""" Retrieves the access token. """

		if self.session.oauth_network == 'facebook' and self.session.oauth_token_secret != '':
			authorize_params = dict(urlparse.parse_qsl(authorize_params_str))
			
			if 'code' not in authorize_params:
				return {'error': True}

			conn = httplib.HTTPSConnection(self.graph_url)
			
			conn.request('GET',
				self.graph_url + self.oauth_suburl + 
				'?client_id=' + self.api_key + 
				'&client_secret=' + self.api_secret + 
				'&code=' + authorize_params['code'] + 
				'&redirect_uri=' + self.redirect_url)

			resp = conn.getresponse()
			content = resp.read()
			
			if resp.status != 200:
				return {'error': True}
			
			access_token = dict(urlparse.parse_qsl(content))

			self.session.oauth_network = 'facebook'
			self.session.oauth_token = access_token['access_token']
			self.session.oauth_token_secret = 'n/a'

			return {'error': False}
		else:
			return {'error': True}
