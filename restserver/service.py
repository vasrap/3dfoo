import sys, os
abspath = os.path.dirname(__file__)
sys.path.append(abspath)

import web
import json
from lib.network.twitter import oauth as twitter_oauth
from lib.network.facebook import oauth as facebook_oauth

web.config.debug = False
urls = (
	"/oauth-twitter/(.+)", "oauth_twitter",
	"/oauth-facebook/(.+)", "oauth_facebook"
)
app = web.application(urls, globals(), autoreload=False)
session = web.session.Session(app, web.session.DiskStore('/tmp/3dfoo-sessions'), 
	initializer={
		# OAuth related params
		'oauth_network': '', 'oauth_token': '', 'oauth_token_secret': '',
		'network_user_id': '', 'network_user_name': ''
	}
)

class oauth_twitter:
	def GET(self, step):
		web.header('Content-Type','text/html; charset=utf-8', unique=True)
		
		oauth_obj = twitter_oauth(session)
		if step == '9':
			return json.dumps(oauth_obj.testToken())
		elif step == '1':
			return json.dumps(oauth_obj.request())
		elif step == '2':
			authorize_params_str = web.ctx.query.encode('ascii','ignore')[1:]
			return json.dumps(oauth_obj.access(authorize_params_str))
			
		return json.dumps({'error': True})
			
class oauth_facebook:
	def GET(self, step):
		web.header('Content-Type','text/html; charset=utf-8', unique=True)
		
		oauth_obj = facebook_oauth(session)
		if step == '9':
			return json.dumps(oauth_obj.testToken())
		elif step == '1':
			return json.dumps(oauth_obj.request())
		elif step == '2':
			authorize_params_str = web.ctx.query.encode('ascii','ignore')[1:]
			return json.dumps(oauth_obj.access(authorize_params_str))
			
		return json.dumps({'error': True})

if __name__ == "__main__":
	app.run()

application = app.wsgifunc()
