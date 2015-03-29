/*
 * GET home page.
 */
var keyWords = require('./keywords.js');
var twitter = require('ntwitter');
var io = require('socket.io').listen(3001, {log: false});
var twitterAPI;
var twitterRestAPI;

var Twit = require('twit');

exports.index = function (req, res) {
    res.render('index', { title: 'Group N+1' });
};

io.on('connection', function(socket){
	
	var twitter_token;
	var twitter_token_secret;
	var four_token;
	
	socket.on('twitter_tokens', function(temp_twitter_token, temp_twitter_token_secret, fn) {
		twitter_token = temp_twitter_token;
		twitter_token_secret = temp_twitter_token_secret;

		twitterAPI = new twitter({
	        consumer_key: "NlT41DmogCgb5C6PsgogvHy29",
	        consumer_secret: "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
	        access_token_key: twitter_token,
	        access_token_secret: twitter_token_secret
	    });
	    twitterRestAPI = new Twit({
		  consumer_key: 'NlT41DmogCgb5C6PsgogvHy29',
		  consumer_secret: '4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905',
		  access_token: twitter_token,
		  access_token_secret: temp_twitter_token_secret	
		});
		
		
		twitterAPI.verifyCredentials(function (err, data) {
            if (err){
            	fn('There was a problem verifiying your Twitter credentials.<br>' + err);
            }
            else{
            	fn('Connection to Twitter was succesfull!');
            }
        });

		
		
	});
	
	socket.on('discussion_search', function(params, fn) {

		console.log("discussion_search params:");
		
		// params.search
		// params.liveresults
		// params.uselocation
		// params.radius
		// params.lat
		// params.long
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		
		var data = {};
		
		// Use streaming API
		
		filterParams = {};
		
		if (params.search != '')
		  filterParams["track"] =  [params.search];
		
		if (params.uselocation) {
		  var bounds = getBoundingBox([params.lat, params.long], params.radius/1000);
		  filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
		  console.log(bounds);
		}
		
		if (params.liveresults) {		
			currentTwitStream = twitterAPI.stream('statuses/filter', filterParams,function (stream) {
                stream.on('data', function (data) {
                    
                    var tempData = {};
                    tempData.tweet = data;
                    
                    // Its geotaggggeddd! Yaaaay
                    if (data["coordinates"]) {
	                    console.log(data["coordinates"]);
	                    tempData.marker = {};
	                    tempData.marker.latitude = data["coordinates"]["coordinates"][1];
	                    tempData.marker.longitude = data["coordinates"]["coordinates"][0];
	                    tempData.marker.label = "<h3>@" + data['user']["screen_name"] + "</h3>" + data["text"] + "";
	                    
                    }

                    //console.log(data.user.screen_name + " : " + data.text);
                    io.sockets.emit('stream_discussion_search', tempData);
                    // throw  new Exception('end');
                });
                
                twitterAPI.currentDiscussionStream = stream;
            });
            
            socket.on('discussion_search_stop_stream', function(fn) {
	            
	            if (twitterAPI.currentDiscussionStream != undefined) {
					twitterAPI.currentDiscussionStream.destroy();
					twitterAPI.currentDiscussionStream = undefined;
	            }
	            
	            return fn();
	      
	        });
	        
	        fn();
		
		// Use REST API
		} else {
			var searchParams;
			if(params.uselocation)
				searchParams = { q: params.search, geocode: [params.lat, params.long, params.radius], count: 200 };
			else
				searchParams = { q: params.search, count: 200 };

			    twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
	                if(!err){
		               
		                var tempData = {};
	                
	                    console.log(data);
		                for (var indx in data.statuses) {
		                	var currentData = data.statuses[indx];
		                	if (currentData["coordinates"]) {
			                    
			                    tempData.marker = {};
			                    tempData.marker.latitude = currentData["coordinates"]["coordinates"][1];
			                    tempData.marker.longitude = currentData["coordinates"]["coordinates"][0];
			                    tempData.marker.label = "<h3>@" + currentData['user']["screen_name"] + "</h3>" + currentData["text"] + "";
			                    //console.log(marker);
			                    
	                    	}
	                    	
		                	

		                }
	            
		            
		            data.markers = tempData;
					data.tweets = data.statuses;
					fn(null, data);
				}
				else{

					console.log(err);
				}
            })
			


			//var data = {};
		
			
			
		}
		
	});
	
	socket.on('user_discussion_search', function(params, fn) {

		console.log("user_discussion_search params:");
		
		// params.screenname
		// params.keywords
		// params.days
		// params.liveresults
		// params.uselocation
		// params.radius
		// params.lat
		// params.long
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		if (params.liveresults) {	

		} 
		else {
			// params.screennames
			// params.keywords
			// params.days
			// params.liveresults
			// params.uselocation
			// params.radius
			// params.lat
			// params.long
			keyWords.reset();
		    var tempData = {};
        	var userDiscussionJsonData = {};
        	userDiscussionJsonData.users = [];
        	var i =0;
			var users = params.screennames.split(" ");
			var countOfUsers = 0;

			var data1 = {};

			users.forEach(function(userMan){

				console.log(userMan);
				var searchParams;
				//console.log(userMan);
				if(params.uselocation){
					searchParams = { screen_name: userMan, geocode: [params.lat, params.long, params.radius],since_id:params.days, count: 200 };

				}
				else{
					searchParams = { screen_name: userMan,since_id:params.days, count: 200 };
					
				}
				if(searchParams){
				
					twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {

					
		                if(!err){
			               
		                	//console.log(userMan+ "1");
		                	//console.log(data);
			                for (var indx in data) {
			                	var currentData = data[indx];				
								var found;
								keyWords.addWords(currentData.user.screen_name, currentData.text);
								if(countOfUsers==0){
									userDiscussionJsonData.users.push({username: currentData.user.screen_name, user_id:currentData.user.id});
									//console.log(currentData)

									countOfUsers += 1;
								}
								else{
									var found = false;
									 
									userDiscussionJsonData.users.forEach(function(obj, i){
										
									    if(obj.username ==  currentData.user.screen_name) {
									    	found = true;
						
									    }

									});
									if(!found){
										userDiscussionJsonData.users.push({username: currentData.user.screen_name, user_id:currentData.user.id});
										countOfUsers += 1;
									}
								}
			                	if (currentData["coordinates"]) {
				                    
				                    tempData.marker = {};
				                    tempData.marker.latitude = currentData["coordinates"]["coordinates"][1];
				                    tempData.marker.longitude = currentData["coordinates"]["coordinates"][0];
				                    tempData.marker.label = "<h3>@" + currentData['user']["screen_name"] + "</h3>" + currentData["text"] + "";
				                    //console.log(marker);
				                    
		                    	}
			                

								
							
                    		}
                    		console.log(countOfUsers);
						//A Node walkaround to return data only when finished
							if(countOfUsers == users.length){
									console.log("hey");
							
									console.log(users);
									//console.log();
									var x = keyWords.reformatToJamesJson(keyWords.topKeyWords(5,users));
									console.log(x);
									userDiscussionJsonData.words = x;
							        
						            data1.markers = tempData;
									data1.userdiscussiontable = userDiscussionJsonData;
									//console.log(userDiscussionJsonData);
									fn(null, data1);
							}
						}
						else{

							console.log(err);
						
						}
		            });
				}
			});
				

			
			//starts here first
		}	

	});
	
	socket.on('user_venues_search', function(params, fn) {

		console.log("user_venues_search params:");
		
		// params.screenname
		// params.days
		// params.liveresults
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		
		var data = {};
		
		data.user = exampleUserJson;
		data.markers = exampleMarkerJson;
		data.visitedvenuestable = visitedVenuesJson;

		fn(null, data);
	});
	
	socket.on('venue_search', function(params, fn) {

		console.log("venue_search params:");
		
		// params.days
		// params.liveresults
		// params.radius
		// params.lat
		// params.long
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		
		var data = {};
		
		data.markers = exampleMarkerJson;
		data.visitedvenuestable = venueUserVistorsJson;

		fn(null, data);
	});
	
	socket.on('database_user_search', function(params, fn) {

		console.log("database_user_search params:");
		
		// params.username
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		
		var data = {};
		
		data.databaseusertable = databaseUserJson;

		fn(null, data);
	});
	
	socket.on('database_venue_search', function(params, fn) {

		console.log("database_venue_search params:");
		
		// params.venue_name_coordinates
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		
		var data = {};
		
		data.databasevenuetable = databaseVenueJson;

		fn(null, data);
	});
	
	socket.on('get_tweet_replies', function(tweet_id, fn) {

		console.log("get_tweet_replies id: " + tweet_id);
		
		var data = {};
		
		data.tweets = [exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1];

		fn(null, data);
	});
	
	socket.on('database_get_users_at_venue', function(tweet_id, fn) {

		console.log("get_tweet_replies id: " + tweet_id);
		
		var data = {};
		data.location_name = "TODO: Location name goes here";
		data.databaseusertable = databaseUserJson;

		fn(null, data);
	});
	
	socket.on('database_get_user_and_tweets', function(user_id, fn) {

		console.log("database_get_user_and_tweets id: " + user_id);
		
		var data = {};
		data.user = exampleUserJson;
		data.markers = exampleMarkerJson;
		data.tweets = [exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1];

		fn(null, data);
	});
	
	socket.on('get_user_and_tweets', function(user_id, fn) {

		console.log("get_user_and_tweets id: " + user_id);
		
		var data = {};
		data.user = exampleUserJson;
		data.markers = exampleMarkerJson;
		data.tweets = [exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1];

		fn(null, data);
	});
	
});





//------------------
//var twit = new twitter({
//	            consumer_key: "NlT41DmogCgb5C6PsgogvHy29",
//	            consumer_secret: "4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905",
//	            access_token_key: req.session.oauth.access_token,
//	            access_token_secret: req.session.oauth.access_token_secret
//	          });
//
//
//	          twit
//	            .verifyCredentials(function(err, data) {
//	              console.log(err);
//	            })
//	            .updateStatus('Test tweet from ntwitter/' + twitter.VERSION,
//	              function(err, data) {
//	                console.log(err, data?data.toString():"");
//	                //res.redirect('/');
//	                res.render('endoftwit', { title: 'Social Tracker', oauth:oauth});
//	              }
//	          );
//------------------




//router.get('/auth/twitter/callback'
exports.authTwitter =  function(req, res, next) {
	console.log("callback");
	console.log(req.session.oauth);
	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth});
};


exports.endoftwit = function(req, res, next) {

	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth });
};



function getBoundingBox(centerPoint, distance) {
	
	var GeoPoint = require('geopoint'),
    point = new GeoPoint(parseFloat(centerPoint[0]), parseFloat(centerPoint[1]));
	
	coordinates = point.boundingCoordinates(distance, true);
	
	return [coordinates[0]["_degLat"], coordinates[0]["_degLon"], coordinates[1]["_degLat"], coordinates[1]["_degLon"]];
	
}


// Test data
var exampleUserJson = {"id":308358479,"id_str":"308358479","name":"James McIlveen","screen_name":"jtmcilveen","location":"Whaley Bridge","profile_location":null,"description":"Rock climber (bouldering) and computer scientist doing my Masters at Sheffield University","url":"http://t.co/BiYvW71Wux","entities":{"url":{"urls":[{"url":"http://t.co/BiYvW71Wux","expanded_url":"http://www.jamesmcilveen.com","display_url":"jamesmcilveen.com","indices":[0,22]}]},"description":{"urls":[]}},"protected":true,"followers_count":58,"friends_count":31,"listed_count":0,"created_at":"Tue May 31 08:22:02 +0000 2011","favourites_count":9,"utc_offset":0,"time_zone":"London","geo_enabled":false,"verified":false,"statuses_count":53,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/490139247945719809/GHt2iObY_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/490139247945719809/GHt2iObY_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/308358479/1405693222","profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"default_profile":true,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false,"suspended":false,"needs_phone_verification":false};

var exampleTweetJson_1 = {"coordinates":[53.381796,-1.480719],"favorited":false,"truncated":false,"created_at":"Mon Sep 24 03:35:21 +0000 2012","id_str":"250075927172759552","entities":{"urls":[],"hashtags":[{"text":"example","indices":[20,34]}],"user_mentions":[]},"in_reply_to_user_id_str":null,"contributors":null,"text":"This is an #example tweet 1111111111","metadata":{"iso_language_code":"en","result_type":"recent"},"retweet_count":0,"in_reply_to_status_id_str":null,"id":250075927172759552,"geo":{"type":"point","coordinates":[53.381796,-1.480719]},"retweeted":false,"in_reply_to_user_id":null,"place":null,"user": exampleUserJson,"in_reply_to_screen_name":null,"source":"<a>Twitter for Mac</a>","in_reply_to_status_id":null};

var exampleTweetJson_2 = {"coordinates":[53.3816232,-1.4817597],"favorited":false,"truncated":false,"created_at":"Mon Sep 24 03:35:21 +0000 2012","id_str":"250075927172759552","entities":{"urls":[],"hashtags":[{"text":"example","indices":[20,34]}],"user_mentions":[]},"in_reply_to_user_id_str":null,"contributors":null,"text":"This is an #example tweet 2222222222","metadata":{"iso_language_code":"en","result_type":"recent"},"retweet_count":0,"in_reply_to_status_id_str":null,"id":250075927172759552,"geo":{"type":"point","coordinates":[53.3816232,-1.4817597]},"retweeted":false,"in_reply_to_user_id":null,"place":null,"user": exampleUserJson ,"in_reply_to_screen_name":null,"source":"<a>Twitter for Mac</a>","in_reply_to_status_id":null};

var collectionOfTweets = [exampleTweetJson_1,exampleTweetJson_2];

var userDiscussionJson = {"users":[{"username":"jtmcilveen", "user_id":"839249234"},{"username":"fabcirca", "user_id":"839249235"},{"username":"stephenfry", "user_id":"839249236"}],"words":[{"word":"London","occurences":[5,2,6]},{"word":"Music","occurences":[3,4,1]}]};

var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];

var venueUserVistorsJson = [{"user":"jtmcilveen", "user_id":"839249234", "visits":"5"},{"user":"fabcirca", "user_id":"839249235", "visits":"2"}];

var exampleMarkerJson = [{"label":"<h3>@jtmcilveen</h3>Random tweet number 1","lat":53.381796,"long":-1.480719}, {"label":"<h3>@jtmcilveen</h3>Random tweet number 2","lat":53.3816232,"long":-1.4817597}];

var databaseUserJson = [{"user_id":"839249234", "user":"jtmcilveen", "name":"James McIlveen"},{"user_id":"839249234", "user":"jtmcilveen", "name":"James McIlveen"},{"user_id":"839249234", "user":"jtmcilveen", "name":"James McIlveen"}];

var databaseVenueJson = [{"venue":"St Georges Church", "coordinates":"53.3816232,-1.4817597", "visitors":12},{"venue":"St Georges Church", "coordinates":"53.3816232,-1.4817597", "visitors":12},{"venue":"St Georges Church", "coordinates":"53.3816232,-1.4817597", "visitors":12},{"venue":"St Georges Church", "coordinates":"53.3816232,-1.4817597", "visitors":12}];