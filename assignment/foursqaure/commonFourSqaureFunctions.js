var Q = require("q");
var request = require("request");
var sys = require('sys')

/////FourSqaure config
var accessToken = 'Q45LXRJRPRK410WSWXP25AVR5HIIFQ3VND4PY55BAQ43AIYQ';
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



//////test stuff///////
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



function getVenues(params){
	client.get('statuses/user_timeline', params, function(err, data, response) {
		getFourSquareFromTweets(data,function(checkins){
			getCheckin(checkins,function(callback){

				//console.log(callback);
			});
		});

    });

}

var getVenuesFromLocation = exports.getVenuesFromLocation = function(location, callback){
	
	//client.get('statuses/user_timeline', params, function(err, data, response) {
	//	
	//	callback(null, data);
	//
    //});
    
    
    var options = {
        // localhost does not work if you run from localhost the server itself
        url: 'https://api.foursquare.com/v2/venues/search',
        method: 'GET',
        headers: headers,
        qs: {'ll': location, 'oauth_token': accessToken, 'v': '20140806', 'limit': 10}
    }

// Start the request

    request(options, function (error, response, body) {
	    
      	var header = response.client['_httpMessage']['_header'];
      	
      	if (!error && response.statusCode == 200) {
	  	
      	    callback(error,body);
	  	
      	} else {
      		console.log('errors: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
      	}
        	
    });

}


var getFourSquareFromTweets = exports.getFourSquareFromTweets = function(tweets,callback){



	var counter = 0;
    for (var indx in tweets) {


    	var tweet= tweets[indx];
    	var checkins = [];
 
    	if('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>'==tweet.source){

			var regex = /t.co\/[a-zA-Z0-9]+/;
			var result = tweet.text.match(regex);
			var id = result[0].replace('t.co/','');
		    //console.log(urlExpander.expand(result[0]));
		    //console.log(result[0]);


		    /*
		    expandUrl("http://"+result[0])
			.then(function (longUrl) {
				*/


				var shortTwitterURL = id + "?tweetUserID="+ tweet.user.id + "&tweetID=" +tweet.id + "&screen_name=" +tweet.user.screen_name
				/*
				expander(shortTwitterURL,function(longUrl){
					*/
				urlExpander(shortTwitterURL,function(longUrl, userID, tweetID,screen_name){


				var fourRegex = /c\/[a-zA-Z0-9]+/;
				if(fourRegex.test(longUrl)){

					var result2 = longUrl.match(fourRegex);

					result2 = result2[0].replace('c/','');
				//	console.log(result2);
				    //console.log(result2);
				    
				    getCheckin(result2,userID,tweetID,screen_name,function(err, checkin){
				    	if(err)
				    		callback(checkins);
			    		else{
					    	checkins.push(checkin);
					    	counter++;
				    
					    	if(tweets.length == counter){
					    		callback(checkins);
					    	}
				    	}
				    });

				}
				else{
					counter++;
					if(tweets.length == counter){
					 callback(checkins);
						

				    }
				}
				
			});

	
		}
		else{
			counter++;
			if(tweets.length == counter){
			   callback(checkins);
			}
		}

		
		
    }

   
}

var getFourSquareFromTweetsLive = exports.getFourSquareFromTweetsLive = function(tweet,callback){


	var checkins = [];
	if('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>'==tweet.source){

		var regex = /t.co\/[a-zA-Z0-9]+/;
		var result = tweet.text.match(regex);
	    //console.log(result[0]);
	    var id = result[0].replace('t.co/','');
	    var shortTwitterURL = id + "?tweetUserID="+ tweet.user.id + "&tweetID=" +tweet.id
	    urlExpander(shortTwitterURL,function(longUrl, userID, tweetID){

	    	
	    	//console.log(longUrl);
	    	var fourRegex = /c\/[a-zA-Z0-9]+/;

			if(fourRegex.test(longUrl)){
				
				var result2 = longUrl.match(fourRegex);
				result2 = result2[0].replace('c/','');

			    //console.log(result2);
			    getCheckin(result2,userID,tweetID,function(err, checkin){
		    	if(err)
		    		callback(checkins);
		    	else{
			    	checkins.push(checkin);
			    
			    	callback(checkins);
}			    	
			    });
			}
			else
				callback(null);
			

		});
	}
	
		
}

   


var getCheckin = function(checkinId,userID,tweetID,screen_name, callback) {
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
        qs: {'shortId': checkinId, 'oauth_token': accessToken,
            'v': '20140806', m: 'swarm', 'userID':userID, 'tweetID':tweetID, 'screen_name':screen_name}
    }

// Start the request

    request(options,
        function (error, response, body) {
        	var header = response.client['_httpMessage']['_header'];
        	var twitterUserIDHeader = header.match(twitterUserExtractor);
        	var tweetIDHeader = header.match(tweetIDExtractor);
   			var checkinIDHeader = header.match(checkinExtractor);
   			var twitterScreen_nameHeader = header.match(tweetScreenNameExtractor);

   			//console.log(checkinIDHeader);
			var checkin = {};
			checkin.swarmURL = checkinIDHeader[0].replace('shortId=','');
			//console.log(checkin.swarmURL);

			checkin.twitterID = twitterUserIDHeader[0].replace('userID=','');
			checkin.tweetID = tweetIDHeader[0].replace('tweetID=','');
			checkin.screen_name = twitterScreen_nameHeader[0].replace('screen_name=','');
			//console.log(twitterUserIDHeader[0]);

			checkin.checkin = JSON.parse(response.body).response.checkin;
        
            if (!error && response.statusCode == 200) {

                callback(null,checkin);

            }
            else {
            	console.log('errors: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
            if(response.statusCode=403){
            	var datetime = new Date(response.caseless.dict['x-ratelimit-reset']*1000);
            	console.log("API Resets at: " + datetime);
            	callback("err",null);

            }
        }
        });


}


/*
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
var http = require('http');
function urlExpander(url,callback){
  //console.log(url);
  var options = {
  host: 't.co',
  port: 80,
  path: '/'+url,
  method: 'POST'
  };
  var twitterUserExtractor = /tweetUserID=[0-9]+/;
  var tweetIDExtractor = /tweetID=[0-9]+/;
  var tweetScreenNameExtractor = /screen_name=[@]*[a-zA-Z0-9]+/;
	

	
	

  var req = http.request(options, function(res) {
  	        var header = res.client['_httpMessage']['_header'];
        	var twitterUserIDHeader = header.match(twitterUserExtractor);
        	var tweetIDHeader = header.match(tweetIDExtractor);
        	var twitterScreen_nameHeader = header.match(tweetScreenNameExtractor);



        	var twitterUserID = twitterUserIDHeader[0].replace('tweetUserID=','');
        	var tweetID = tweetIDHeader[0].replace('tweetID=','');
        	var screen_name;
        	if(twitterScreen_nameHeader==null){
        			screen_name = "anonymous user"
        	}
        	else
        	{
        			 screen_name = twitterScreen_nameHeader[0].replace('screen_name=','');
        	}
//        	console.log(screen_name);
  //console.log(twitterIDHeader);
  callback(JSON.stringify(res.headers),twitterUserID,tweetID, screen_name);
  //callback()
  res.on('data', function (chunk) {
    //console.log('BODY: ' + chunk);

  });
  });

  req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
  });

  req.end();

}