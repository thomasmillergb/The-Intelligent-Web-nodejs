var Q = require("q");
var request = require("request");
var sys = require('sys')
var http = require('http');
/////FourSqaure config
//var accessToken = 'Q45LXRJRPRK410WSWXP25AVR5HIIFQ3VND4PY55BAQ43AIYQ';
var config = {
    'secrets': {
        'clientId': 'WWHPMVGICEKKWCFXOHIAVCDD453M5VFYF5V3IZCVH1YRPRYX',
        'clientSecret': 'HME2CRWP5BGW1DSSCD2THCATYX43K1NXJLXYXZZVJS5LBBTM',
        'redirectUrl': 'http://127.0.0.1:3000/auth/foursqaure/callback'
    },
    'foursquare': {
        'mode': 'swarm'
    }
}
var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    //////test functions///////
var Twit = require('twit');
var params = {};
var client = new Twit({
    consumer_key: 'NlT41DmogCgb5C6PsgogvHy29',
    consumer_secret: '4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905',
    access_token: '351930928-yxyRBBj5UOOKXVBGNrVXs562E77PkWgPglqP0yma',
    access_token_secret: 'hqDIZPei3XVXliXGCMiSqkW4pCaLrgI1pzxr9PVidPVLh'
});
params.screen_name = 'killermillergb';
//getVenues(params);
function getVenues(params) {
        client.get('statuses/user_timeline', params, function(err, data, response) {
            getFourSquareFromTweets(data, function(checkins) {
                getCheckin(checkins, function(callback) {
                    //console.log(callback);
                });
            });
        });
    }
    //////////////////////////
    /**
 returns the details about the location

param location  venue location
param accessToken  clients foursqaure access token
param callback  returns the details about the location

*/
var getVenuesFromLocation = exports.getVenuesFromLocation = function(location, accessToken, callback) {
        var options = {
            url: 'https://api.foursquare.com/v2/venues/search',
            method: 'GET',
            headers: headers,
            qs: {
                'll': location,
                'oauth_token': accessToken,
                'v': '20140806',
                'limit': 10
            }
        }
        request(options, function(error, response, body) {
            var header = response.client['_httpMessage']['_header'];
            if (!error && response.statusCode == 200) {
                callback(error, body);
            } else {
                console.log('errors: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
            }
        });
    }
    /**
 returns all the checkins found in the tweets

param tweets  tweets
param accessToken  clients foursqaure access token
param callback  returns all the foursqaure checkins

*/
var getFourSquareFromTweets = exports.getFourSquareFromTweets = function(tweets, accessToken, callback) {
        var counter = 0;
        for (var indx in tweets) {
            var tweet = tweets[indx];
            var checkins = [];
            if ('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>' == tweet.source) {
                var regex = /t.co\/[a-zA-Z0-9]+/;
                var result = tweet.text.match(regex);
                var id = result[0].replace('t.co/', '');
                var shortTwitterURL = id + "?tweetUserID=" + tweet.user.id + "&tweetID=" + tweet.id + "&screen_name=" + tweet.user.screen_name;
                urlExpander(shortTwitterURL, function(longUrl, userID, tweetID, screen_name) {
                    var fourRegex = /c\/[a-zA-Z0-9]+/;
                    if (fourRegex.test(longUrl)) {
                        var result2 = longUrl.match(fourRegex);
                        result2 = result2[0].replace('c/', '');
                        getCheckin(result2, userID, tweetID, screen_name, accessToken, function(err, checkin) {
                            if (err) callback(checkins);
                            else {
                                checkins.push(checkin);
                                counter++;
                                if (tweets.length == counter) {
                                    callback(checkins);
                                }
                            }
                        });
                    } else {
                        counter++;
                        if (tweets.length == counter) {
                            callback(checkins);
                        }
                    }
                });
            } else {
                counter++;
                if (tweets.length == counter) {
                    callback(checkins);
                }
            }
        }
    }
    /**
 returns all the checkins found in a tweet stream

param tweets  tweets
param accessToken  clients foursqaure access token
param callback  returns all the foursqaure checkins

*/
var getFourSquareFromTweetsLive = exports.getFourSquareFromTweetsLive = function(tweet, accessToken, callback) {
        var checkins = [];
        if ('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>' == tweet.source) {
            var regex = /t.co\/[a-zA-Z0-9]+/;
            var result = tweet.text.match(regex);
            //console.log(result[0]);
            var id = result[0].replace('t.co/', '');
            var shortTwitterURL = id + "?tweetUserID=" + tweet.user.id + "&tweetID=" + tweet.id + "&screen_name=" + tweet.user.screen_name;
            urlExpander(shortTwitterURL, function(longUrl, userID, tweetID, screen_name) {
                //console.log(longUrl);
                var fourRegex = /c\/[a-zA-Z0-9]+/;
                if (fourRegex.test(longUrl)) {
                    var result2 = longUrl.match(fourRegex);
                    result2 = result2[0].replace('c/', '');
                    getCheckin(result2, userID, tweetID, screen_name, accessToken, function(err, checkin) {
                        if (err) callback(checkins);
                        else {
                            checkins.push(checkin);
                            callback(checkins);
                        }
                    });
                } else callback(null);
            });
        }
    }
    //Since grabing details about foursqaure venue is very heavy on using api calls, to provent repeative calls details of the venue is cached server side.
var venueCach = [];
var checkinsCach = [];
/**
gets the checkin from a tweet and returns with the tweet and user info

param checkinId  the id of the checkin
param userID  the twitter user id from tweet
param tweetID  the tweet id
param screen_name  screenname of the user from the tweet
param accessToken  clients foursqaure access token
param callback  returns the checkin with the twitter details
*/
var getCheckin = function(checkinId, userID, tweetID, screen_name, accessToken, callback) {
        var checkinExtractor = /shortId=[a-zA-Z0-9]+/;
        var twitterUserExtractor = /userID=[0-9]+/;
        var tweetIDExtractor = /tweetID=[0-9]+/;
        var tweetScreenNameExtractor = /screen_name=[a-zA-Z0-9]+/;
        //console.log("twitterID: " +twitterID)
        // Configure the request
        var options = {
                // localhost does not work if you run from localhost the server itself
                url: 'https://api.foursquare.com/v2/checkins/resolve',
                method: 'GET',
                headers: headers,
                qs: {
                    'shortId': checkinId,
                    'oauth_token': accessToken,
                    'v': '20140806',
                    m: 'swarm',
                    'userID': userID,
                    'tweetID': tweetID,
                    'screen_name': screen_name
                }
            }
            // Start the request
        request(options, function(error, response, body) {
            //extracts the twitter user info from response
            var header = response.client['_httpMessage']['_header'];
            var twitterUserIDHeader = header.match(twitterUserExtractor);
            var tweetIDHeader = header.match(tweetIDExtractor);
            var checkinIDHeader = header.match(checkinExtractor);
            var twitterScreen_nameHeader = header.match(tweetScreenNameExtractor);
            //console.log(checkinIDHeader);
            var checkin = {};
            checkin.swarmURL = checkinIDHeader[0].replace('shortId=', '');
            //console.log(checkin.swarmURL);
            checkin.twitterID = twitterUserIDHeader[0].replace('userID=', '');
            checkin.tweetID = tweetIDHeader[0].replace('tweetID=', '');
            checkin.screen_name = twitterScreen_nameHeader[0].replace('screen_name=', '');
            checkin.checkin = JSON.parse(response.body).response.checkin;
            if (!error && response.statusCode == 200) {
                //if not here cach and get
                findCachVenue(checkin, function(found, checkin) {
                    if (!found) {
                        getVenueDetails(checkin, accessToken, function(venue) {
                            cachVenue(venue, checkin, function(checkin) {
                                callback(null, checkin);
                            });
                        });
                    } else {
                        callback(null, checkin);
                    }
                });
            } else {
                console.log('errors: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
                if (response.statusCode = 403) {
                    var datetime = new Date(response.caseless.dict['x-ratelimit-reset'] * 1000);
                    console.log("API Resets at: " + datetime);
                    callback("err", null);
                }
            }
        });
    }
    /**
caches venue extra details and returns the checkin with the extra details

param venue all details of venue in a json format
param checkin  deatils of the checkin in a json format
param callback  returns the checkin with the extra venue details
*/
var cachVenue = function(venue, checkin, callback) {
        var found = false;
        var counter = 0;
        while (counter < venueCach.length && !found) {
            //annoying null check, which should not need a null check
            if (typeof venue.venue !== "undefined")
                if (venueCach[counter].venue.id == venue.venue.id) {
                    found = true;
                    checkin.checkin.venue = venueCach[counter].venue;
                    callback(checkin);
                } else {} else console.log(venue.venue);
            counter++;
        }
        if (!found) {
            if (typeof venue.venue !== "undefined") {
                venueCach.push(venue);
                checkin.checkin.venue = venue.venue;
                callback(checkin);
            } else {
                checkin.checkin.venue = venueCach[0].venue;
                callback(checkin);
            }
        }
    }
    /**
find venue in the venue cach

param checkin  deatils of the checkin in a json format
param callback  returns the checkin with the extra venue details
*/
var findCachVenue = function(checkin, callback) {
        var found = false;
        var counter = 0;
        while (counter < venueCach.length && !found) {
            if (venueCach[counter].venue.id == checkin.checkin.venue.id) {
                found = true;
                checkin.checkin.venue = venueCach[counter].venue;
                callback(true, checkin);
            }
            counter++;
        }
        callback(false, checkin);
    }
    /**
makes an api call to get the venue details

param checkin  deatils of the checkin in a json format
param accessToken the clients foursqaure accesstoken
param callback  returns the checkin with the extra venue details
*/
var getVenueDetails = function(checkin, accessToken, callback) {
        //console.log(checkin);
        var options = {
            // localhost does not work if you run from localhost the server itself
            url: 'https://api.foursquare.com/v2/venues/' + checkin.checkin.venue.id,
            method: 'GET',
            headers: headers,
            qs: {
                'oauth_token': accessToken,
                'v': '20140806',
                m: 'swarm'
            }
        }
        request(options, function(error, response, body) {
            callback(JSON.parse(response.body).response);
        });
    }
    /*
Old attempts to expand URL
 var urlExpander = require('expand-url');


function expander(shortUrl,callback){

    urlExpander.expand(shortUrl ,function(err, longUrl){
    	//console.log(response)
  
        callback(longUrl);
    });

}

var SingleUrlExpander = require('url-expander').SingleUrlExpander;

function expander(shortUrl,callback){
	//console.log(shortUrl);
	var expander = new SingleUrlExpander(shortUrl);
	//console.log(expander);
	expander.on('expanded', function (originalUrl, expandedUrl) {
    // do something
    console.log(originalUrl);
    console.log(expandedUrl);
	});
	expander.expand();

}
*/
    /**
Expands short URL

param url the short url that wants to be expanded
param callback  the expanded url
*/

function urlExpander(url, callback) {
    //console.log(url);
    var options = {
        host: 't.co',
        port: 80,
        path: '/' + url,
        method: 'POST'
    };
    var twitterUserExtractor = /tweetUserID=[0-9]+/;
    var tweetIDExtractor = /tweetID=[0-9]+/;
    var tweetScreenNameExtractor = /screen_name=[@]*[a-zA-Z0-9]+/;
    var req = http.request(options, function(res) {
        //Extracts the twitter info which was passed with query
        var header = res.client['_httpMessage']['_header'];
        var twitterUserIDHeader = header.match(twitterUserExtractor);
        var tweetIDHeader = header.match(tweetIDExtractor);
        var twitterScreen_nameHeader = header.match(tweetScreenNameExtractor);
        var twitterUserID = twitterUserIDHeader[0].replace('tweetUserID=', '');
        var tweetID = tweetIDHeader[0].replace('tweetID=', '');
        var screen_name;
        if (twitterScreen_nameHeader == null) {
            screen_name = "anonymous user"
        } else {
            screen_name = twitterScreen_nameHeader[0].replace('screen_name=', '');
        }
        //        	console.log(screen_name);
        //console.log(twitterIDHeader);
        callback(JSON.stringify(res.headers), twitterUserID, tweetID, screen_name);
        //callback()
        res.on('data', function(chunk) {
            //console.log('BODY: ' + chunk);
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
}