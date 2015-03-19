/*
 * GET home page.
 */


var twitter = require('ntwitter');
var io = require('socket.io').listen(3001, {log: false});
exports.index = function (req, res) {
    res.render('index', { title: 'Express' });
    if (req.session.oauth) {
        InitStream(req.session);
    }
};
var isActive = false;
var InitStream = function (session) {
	console.log("session");
	console.log(session);
    var twit = new twitter({
        consumer_key: "NlT41DmogCgb5C6PsgogvHy29",
        consumer_secret: "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
        access_token_key: session.oauth.access_token,
        access_token_secret: session.oauth.access_token_secret
    });

    twit
        .verifyCredentials(function (err, data) {
            //console.log(err, data?data.toString():'');
        })
        .updateStatus('Test tweet from ntwitter/' + twitter.VERSION,
        function (err, data) {
            //console.log(data);
        }
    );


    if (!isActive) {
    twit.stream('statuses/sample', function(stream) {
    stream.on('data', function (data) {
        console.log(data);
        });
        });
        isActive = true;
    }
};


//router.get('/auth/twitter/callback'
exports.authTwitter =  function(req, res, next) {
	console.log("callback");
	console.log(req.session.oauth);
	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth});
};


exports.endoftwit = function(req, res, next) {

	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth });
};



//module.exports = router;
