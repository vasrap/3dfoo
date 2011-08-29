import urlparse
import urllib
import oauth2
import json

class oauth(object):
	consumer_key = ''
	consumer_secret = ''
	
	request_token_url = 'https://api.twitter.com/oauth/request_token'
	access_token_url = 'https://api.twitter.com/oauth/access_token'
	authorize_url = 'https://api.twitter.com/oauth/authorize'
	friends_url = 'https://api.twitter.com/1/friends/ids.json'

	session = 0

	def __init__(self, session):
		self.session = session

	def testToken(self):
		if self.session.oauth_network == 'twitter' and self.session.oauth_token != '':
			token = oauth2.Token(self.session.oauth_token, self.session.oauth_token_secret)
			consumer = oauth2.Consumer(self.consumer_key, self.consumer_secret)
			client = oauth2.Client(consumer, token)
			
			resp, content = client.request(
				self.friends_url, 'GET', 
				urllib.urlencode({'screen_name': self.session.network_user_name}))

			content = json.loads(content)

			if resp['status'] != '200' or not content[0] > 0:
				return {'error': True}

			response = {
				'oauth_network': 'twitter', 
				'oauth_token': self.session.oauth_token,
				'oauth_token_secret': self.session.oauth_token_secret,
				'error': False}

			return response
		else:
			return {'error': True}



	def request(self):
		consumer = oauth2.Consumer(self.consumer_key, self.consumer_secret)
		client = oauth2.Client(consumer)

		resp, content = client.request(self.request_token_url, "GET")
		if resp['status'] != '200':
			return {'error': True}

		request_token = dict(urlparse.parse_qsl(content))

		self.session.oauth_network = 'twitter'
		self.session.oauth_token_secret = request_token['oauth_token_secret']

		return {'authorize_url': self.authorize_url + '?oauth_token=' + request_token['oauth_token'], 'error': False}

	def access(self, authorize_params_str):
		if self.session.oauth_network == 'twitter' and self.session.oauth_token_secret != '':
			consumer = oauth2.Consumer(self.consumer_key, self.consumer_secret)
			client = oauth2.Client(consumer)
			authorize_params = dict(urlparse.parse_qsl(authorize_params_str))
			
			oauth_token_secret = self.session.oauth_token_secret

			token = oauth2.Token(authorize_params['oauth_token'], oauth_token_secret)
			token.set_verifier(authorize_params['oauth_verifier'])
			client = oauth2.Client(consumer, token)
			
			resp, content = client.request(self.access_token_url, "POST")
			if resp['status'] != '200':
				return {'error': True}
			
			access_token = dict(urlparse.parse_qsl(content))

			self.session.oauth_network = 'twitter'
			self.session.oauth_token = access_token['oauth_token']
			self.session.oauth_token_secret = access_token['oauth_token_secret']

			return {'error': False}
		else:
			return {'error': True}
