var OAuth= require('oauth').OAuth;
var expressSession = require('express-session');
var https = require('https');
var client_id = "WWHPMVGICEKKWCFXOHIAVCDD453M5VFYF5V3IZCVH1YRPRYX";
var client_secret = "HME2CRWP5BGW1DSSCD2THCATYX43K1NXJLXYXZZVJS5LBBTM"
var redirect = "http://127.0.0.1:3000/auth/foursqaure/callback";

module.exports = function(app){
	
	app.get('/auth/foursqaure', function(req, res){
		app.use(expressSession({secret: 'mySecretKey'}));
		var foursquareLink= 'https://foursquare.com/oauth2/authenticate?client_id='+client_id+'&response_type=code&redirect_uri='+redirect;
		res.redirect(foursquareLink);

	});
//EGWCVECGNWTIO410DTWDL4HVWEAZH4LHP1X2PYJWBCKA5Z04
	app.get('/auth/foursqaure/callback', function(req, res, next){

			var code = req.query.code;
			var request = require("request");
 var tokenURL = "https://foursquare.com/oauth2/access_token?client_id="+client_id+"&client_secret="+client_secret+"&grant_type=authorization_code&redirect_uri="+redirect+"&code="+code;
request(tokenURL, function(error, response, body) {
  var access_token = (JSON.parse(body));
  res.render('endoffour', { title: 'Social Tracker', oauth: access_token});
});
			
	
	});
	
}
