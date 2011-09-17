"""
- Network controller.
- Social network related logic goes here
"""

import json
import web

class oauth(object):
	""" 
	- Goes through the oauth process.
	- Requires an oauth object and the current process step.
	- Returns error if something went wrong.
	"""
	
	oauth_obj = 0
	step = 0

	def __init__(self, oauth_obj, step):
		self.oauth_obj = oauth_obj
		self.step = step

	def process(self):
		if self.step == '9':
			""" Last step. Test access token and return it if valid. """
			return json.dumps(self.oauth_obj.testToken())
		elif self.step == '1':
			""" Step 1. Return the authorize url for the selected network. """
			return json.dumps(self.oauth_obj.request())
		elif self.step == '2':
			""" Step 2. Get the access token and save it to the session. """
			authorize_params_str = web.ctx.query.encode('ascii','ignore')[1:]
			return json.dumps(self.oauth_obj.access(authorize_params_str))
			
		return json.dumps({'error': True})
