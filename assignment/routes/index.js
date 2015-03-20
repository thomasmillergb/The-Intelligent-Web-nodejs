/*
 * GET home page.
 */

var twitter = require('ntwitter');
var io = require('socket.io').listen(3001, {log: false});

exports.index = function (req, res) {
    
    res.render('index', { title: 'Scoial Stalker +' });
    if (req.session.oauth) {
        InitStream(req.session);
    }
    else
    {

        //res.render('index', { title: 'Express', name: "nope" });
    }

};
var isActive = false;
var InitStream = function (session) {
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
        console.log('init Stream');
        twit.stream('statuses/filter',{track: ['pie']},function (stream) {
                stream.on('data', function (data) {
                    //console.log(data);
                    console.log(data.user.screen_name + " : " + data.text);
                    io.sockets.emit('newTwitt', data);
                    // throw  new Exception('end');
                });
                stream.on('end', function (end) {
                    console.log('end stream', end.toString());
                    isActive = false;
                    InitStream(session);
                });
                stream.on('destroy', function (destroy) {
                    console.log('destroy stream', destroy.toString());
                    isActive = false;
                    InitStream(session);
                });
            }
        );
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
