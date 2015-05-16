/**
Performs the oAuth for twitter to get the access token and secret, then send the token back to client 
*/
var OAuth = require('oauth').OAuth;
//var express = require('express');
//var app = express();
var expressSession = require('express-session');
module.exports = function(app) {
    var oa = new OAuth("https://api.twitter.com/oauth/request_token", "https://api.twitter.com/oauth/access_token", "NlT41DmogCgb5C6PsgogvHy29",
        "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905", "1.0", "http://127.0.0.1:3000/auth/twitter/callback", "HMAC-SHA1");
    app.get('/auth/twitter', function(req, res) {
        oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("yeah no. didn't work.")
            } else {
                req.session.oauth = {};
                req.session.oauth.token = oauth_token;
                //console.log('oauth.token: ' + req.session.oauth.token);
                req.session.oauth.token_secret = oauth_token_secret;
                //console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
            }
        });
    });
    var twitter = require('ntwitter');
    app.get('/auth/twitter/callback', function(req, res, next) {
        if (req.session.oauth) {
            req.session.oauth.verifier = req.query.oauth_verifier;
            var oauth = req.session.oauth;
            oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier, function(error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    console.log(error);
                    res.send("yeah something broke.");
                } else {
                    res.render('endoftwit', {
                        title: 'Social Tracker',
                        access_token_key: oauth_access_token,
                        access_token_secret: oauth_access_token_secret
                    });
                }
            });
        } else next(new Error("you're not supposed to be here."))
    });
}