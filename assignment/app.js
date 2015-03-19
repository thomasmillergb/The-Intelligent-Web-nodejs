/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.session({
  secret: "very secret"
}));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
//app.get('/auth/twitter/callback', routes.authTwitter);
app.get('/endoftwit', routes.endoftwit);
//app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

var util = require('util');

var OAuth = require('oauth').OAuth;

var oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  "NlT41DmogCgb5C6PsgogvHy29",
  "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
  "1.0",
  "http://127.0.0.1:3000/auth/twitter/callback",
  "HMAC-SHA1"
);
app.get('/auth/twitter', function(req, res) {
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      console.log(error);
      res.send("yeah no. didn't work.")
    } else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      console.log('oauth.token: ' + req.session.oauth.token);
      req.session.oauth.token_secret = oauth_token_secret;
      console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
    }
  });
});

var twitter = require('ntwitter');
app.get('/auth/twitter/callback', function(req, res, next) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;

    oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
      function(error, oauth_access_token, oauth_access_token_secret, results) {
        if (error) {
          console.log(error);
          res.send("yeah something broke.");
        } else {
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          //console.log(results);
          //console.log(req);
          var twit = new twitter({
            consumer_key: "NlT41DmogCgb5C6PsgogvHy29",
            consumer_secret: "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
            access_token_key: req.session.oauth.access_token,
            access_token_secret: req.session.oauth.access_token_secret
          });


          twit
            .verifyCredentials(function(err, data) {
              //console.log(err, data);
            })
            .updateStatus('Test tweet from ntwitter/' + twitter.VERSION,
              function(err, data) {
                console.log(err, data?data.toString():"");
                //res.redirect('/');
                res.render('endoftwit', { title: 'Social Tracker', oauth:oauth});
              }
          );

        }
      }
    );
  } else
    next(new Error("you're not supposed to be here."))
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
