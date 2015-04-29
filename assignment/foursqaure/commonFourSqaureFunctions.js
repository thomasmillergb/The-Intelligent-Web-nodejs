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
var getFourSquareFromTweets = exports.getFourSquareFromTweets = function(tweets,callback){



	var counter = 0;
    for (var indx in tweets) {


    	var tweet= tweets[indx];
    	var checkins = [];
 
    	if('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>'==tweet.source){

			var regex = /t.co\/[a-zA-Z0-9]+/;
			var result = tweet.text.match(regex);
			//var id = result[0].replace('t.co/','');
		    //console.log(urlExpander.expand(result[0]));
		    //console.log(result[0]);
		    /*
		    expandUrl("http://"+result[0])
			.then(function (longUrl) {
				*/
				expander("http://"+result[0],function(longUrl){
				var fourRegex = /c\/[a-zA-Z0-9]+/;
				if(fourRegex.test(longUrl)){

					var result2 = longUrl.match(fourRegex);

					result2 = result2[0].replace('c/','');
				    //console.log(result2);
				    getCheckin(result2,tweet.user.id,function(err, checkin){
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
var getFourSquareFromTweetsLive = exports.getFourSquareFromTweetsLive = function(tweets,callback){


	var checkins = [];
	if('<a href="http://foursquare.com" rel="nofollow">Foursquare</a>'==tweets.source){

		var regex = /t.co\/[a-zA-Z0-9]+/;
		var result = tweets.text.match(regex);
	    //console.log(result[0]);
	    expander("http://"+result[0],function(longUrl){
	    	//console.log(longUrl);
	    	var fourRegex = /c\/[a-zA-Z0-9]+/;
			if(fourRegex.test(longUrl)){
				
				var result2 = longUrl.match(fourRegex);
				result2 = result2[0].replace('c/','');
			    //console.log(result2);
			    getCheckin(result2,tweets.user.id,function(err, checkin){
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

   


var getCheckin = function(checkinId,twitterID, callback) {
	var twitterExtractor = /twitterID=[0-9]+/;
	//console.log("twitterID: " +twitterID)
// Configure the request
    var options = {
        // localhost does not work if you run from localhost the server itself
        url: 'https://api.foursquare.com/v2/checkins/resolve',
        method: 'GET',
        headers: headers,
        qs: {'shortId': checkinId, 'oauth_token': accessToken,
            'v': '20140806', m: 'swarm', 'twitterID':twitterID}
    }

// Start the request

    request(options,
        function (error, response, body) {
        	var twitterIDHeader = response.client['_httpMessage']['_header'];
        	var twitterIDHope = twitterIDHeader.match(twitterExtractor);
        	//console.log(twitterIDHope);
			var checkin = {};
			checkin.twitterID = twitterIDHope[0].replace('twitterID=','');
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



 var urlExpander = require('expand-url');

function expander(shortUrl,callback){
    urlExpander.expand(shortUrl ,function(err, longUrl){
    	//console.log(response)
  
        callback(longUrl);
    });

}
