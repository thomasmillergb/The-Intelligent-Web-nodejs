var OAuth= require('oauth').OAuth;

//var express = require('express');
//var app = express();


var expressSession = require('express-session');

module.exports = function(app){
	
	//oAuth
	
	app.use(expressSession({secret: 'mySecretKey'}));
	var oa = new OAuth(
		"https://api.twitter.com/oauth/request_token",
		"https://api.twitter.com/oauth/access_token",
		"NlT41DmogCgb5C6PsgogvHy29",
		"4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
		"1.0",
		"http://127.0.0.1:3000/endoftwit",
		"HMAC-SHA1"
	);
	app.get('/auth/twitter', function(req, res){
		oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
			if (error) {
				console.log(error);
				res.send("yeah no. didn't work.")
			}
			else {
				req.session.oauth = {};
				req.session.oauth.token = oauth_token;
				console.log('oauth.token: ' + req.session.oauth.token);
				req.session.oauth.token_secret = oauth_token_secret;
				console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
				res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
		}
		});
	});
	app.get('/auth/twitter/callback', function(req, res, next){
		if (req.session.oauth) {
			req.session.oauth.verifier = req.query.oauth_verifier;
			var oauth = req.session.oauth;

			oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
			function(error, oauth_access_token, oauth_access_token_secret, results){
				if (error){
					console.log(error);
					res.send("yeah something broke.");
				} else {
					req.session.oauth.access_token = oauth_access_token;
					req.session.oauth,access_token_secret = oauth_access_token_secret;
					console.log(req.session.oauth);
					res.send("worked. nice one.");
				}
			}
			);
		} else
			next(new Error("you're not supposed to be here."))
	});

}
