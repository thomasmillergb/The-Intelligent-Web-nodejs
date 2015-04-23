var Twit = require('twit');
var twitter = require('ntwitter');
var keyWords = require('./keywords.js');
var twitterFunctions = require('./twitterFunction.js');
var twitterAPI;
var twitterRestAPI;

var io = require('socket.io').listen(3001, {log: false});

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
		  var bounds = getBoundingBox([params.lat, params.long], params.radius);
		  filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
		  console.log(bounds);
		}
		
		if (params.liveresults) {		
			currentTwitStream = twitterAPI.stream('statuses/filter', filterParams, function (stream) {
				
                

                stream.on('data', function (data) {
                    
                    var tempData = {};
                    tempData.tweet = data;
                    tempData.marker = [];
                    // Its geotaggggeddd! Yaaaay
                   
		    		tempData.marker = twitterFunctions.venues(data,tempData.marker)[0];

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
				searchParams = { q: params.search, geocode: [params.lat, params.long, params.radius + "mi" ], count: 200 };
			else
				searchParams = { q: params.search, count: 200 };

		    twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
                if(!err) {
                	var venues = [];
	                for (var indx in data.statuses) {
	                	var currentData = data.statuses[indx];
	    				venues = twitterFunctions.venues(currentData,venues);
	                }
            
					var venuemarkers = [];
					for (var indx in venues)
                		if (venues[indx].lat && venues[indx].long)
                			venuemarkers.push(venues[indx]);

							data.markers = venuemarkers;
							data.tweets = data.statuses;
							fn(null, data);
				} else {
					fn(null,null);
					console.log(err);
				}
			});
		}
		
	});
	
	socket.on('user_discussion_search', function(params, fn) {
		console.log("user_discussion_search params:");
		
		// params.screennames
	    // params.keywords
	    // params.days
	    // params.liveresults
	    // params.uselocation
	    // params.radius
	    // params.lat
	    // params.long
		
		for (var index in params)
			console.log("    params." + index + ": \"" + params[index] + "\"");

		var data1 = {};
		
		// Use streaming API
		
		filterParams = {};
		
		if (params.search != '')
	
		
		if (params.uselocation) {
			var bounds = getBoundingBox([params.lat, params.long], params.radius);
			filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
		}
		
		if (params.liveresults) {	
			var screennames = [];
			var tempData = {};
			var userDiscussionJsonData = {};
			userDiscussionJsonData.users = [];	
			var countOfUsers = 0;
			var venues =[];
			var userIDString = "";
			var users = params.screennames.replace(/\s/g, '').split(",");
			
			getUserIDsAndScreenNames(users, function(screennamesandids) {
				
				filterParams['follow'] = [];
				
				for (var i = 0; i < screennamesandids.length; i++)
					filterParams['follow'].push(screennamesandids[i].user_id);
	
				currentTwitStream = twitterAPI.stream('statuses/filter', filterParams, function (stream) {
	
					var keywordsTable = {};
					keywordsTable['users'] = [];
				  
					for (var i = 0; i < screennamesandids.length; i++)
						keywordsTable['users'].push(screennamesandids[i]);
				  	
				  
				    keywordsTable['words'] = [];
	
					stream.on('data', function (data) {

						var userid = data.user.id;
						var words = data.text.toLowerCase().split(" ");
				
						var userindex = -1;
				
						for (var i = 0; i < keywordsTable['users'].length; i++)
							if (keywordsTable['users'][i].user_id == userid)
								userindex = i;
				
						words.forEach(function(tweetword)
						{
							var wordindex = -1;
	
							for (var i = 0; i < keywordsTable['words'].length; i++)
								if (keywordsTable['words'][i].word == tweetword)
									wordindex = i;
		
							if (wordindex == -1)
							{
								var tempword = {}
								tempword.word = tweetword
								tempword.occurences = []
								
								for (user in keywordsTable['users'])
									tempword.occurences.push(0);
									
								tempword.occurences[userindex] =+ 1;
										
								keywordsTable['words'].push(tempword);//{"word": tweetword, "occurences" : emptywords});
							}
							else
								keywordsTable.words[wordindex].occurences[userindex] = keywordsTable.words[wordindex].occurences[userindex] + 1;
								
						});
			
						keywordsTable['words'].sort(function(x, y){
				
							xtotal = eval(x.occurences.join('+'));
							ytotal = eval(y.occurences.join('+'));
					
							if (xtotal < ytotal)
								return 1;
							if (xtotal > ytotal)
								return -1;
							return 0;
						});
						
						var tempdata = {};
						
						var maxindex = params.keywords;
						
						if (maxindex > keywordsTable.length)
							maxindex = keywordsTable.length;
						
						tempdata.userdiscussiontable = {};
						tempdata.userdiscussiontable.users = keywordsTable.users;
						tempdata.userdiscussiontable.words = keywordsTable.words.slice(0, maxindex);

						if(data.coordinates){
							tempdata.marker = {};
					        tempdata.marker.lat = data.coordinates.coordinates[1];
					        tempdata.marker.long = data.coordinates.coordinates[0];
					        tempdata.marker.label = "<h3>@" + data.user.screen_name + "</h3>" + data.text + "";
				    	}
		
						io.sockets.emit('stream_user_discussion_search', tempdata);
					});
					
					twitterAPI.currentDiscussionStream = stream;
					
				});
				

				socket.on('user_discussion_search_stop_stream', function(fn) {
	
					if (twitterAPI.currentDiscussionStream != undefined) {
						twitterAPI.currentDiscussionStream.destroy();
						twitterAPI.currentDiscussionStream = undefined;
						keyWords.reset();
					}
	
					return fn();
	
				});
	
				fn();

			});
		} 
		else
		{
			// params.screennames
			// params.keywords
			// params.days
			// params.liveresults
			// params.uselocation
			// params.radius
			// params.lat
			// params.long
			var users = params.screennames.replace(/\s/g, '').split(",");
			
			getUserIDsAndScreenNames(users, function(screennamesandids) {
				userscreennames = [];
				
				for (var i = 0; i < screennamesandids.length; i++)
					userscreennames.push(screennamesandids[i].username);
				
				var data1 = {};
				data1.markers = []
				keyWords.reset();
				var counter = 0;
				userscreennames.forEach(function(userMan){
	
					var searchParams;
	
					if(params.uselocation){
						searchParams = { screen_name: userMan, geocode: [params.lat, params.long, params.radius + "mi"], count: 200 };
	
					}
					else{
						searchParams = { screen_name: userMan, count: 200 };
						
					}
					if(searchParams){
					
						twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
	
						
			                if(!err){
				                
				                //Remove any tweets that are before the specified number of days
				                //There is no way to use the api to do this, so manual clipping 
				                //is needed
				                if (params.days > 0)
				                	data = sliceOlderTweets(data, params.days);
					                
				                
				                
					        	var venues =[];
					        	
				                for (var indx in data) {
				                	var currentData = data[indx];
	
									keyWords.addWords(currentData.user.screen_name, currentData.text);
							
				                	venues = twitterFunctions.venues(currentData, venues);
				             
	                    		}
	                    		
	                    		for (var indx in venues)
						            if (venues[indx].lat && venues[indx].long)
						            	data1.markers.push(venues[indx]);
	                    		
	                    		counter += 1;
	                    		
								if(counter == users.length){
										
									userDiscussionJsonData = keyWords.topKeyWords(params.keywords,users);
									//var venuemarkers = [];
				                	
				                	
				                	userDiscussionJsonData.words.sort(function(x, y) {
									
									  xtotal = eval(x.occurences.join('+'));
									  ytotal = eval(y.occurences.join('+'));
									
									  if (xtotal < ytotal)
									  	return 1;
									  if (xtotal > ytotal)
									  	return -1;
									  return 0;
									});
									
									var maxindex = params.keywords;
							
									if (maxindex > userDiscussionJsonData.words.length)
										maxindex = userDiscussionJsonData.words.length;
									
									userDiscussionJsonData.words = userDiscussionJsonData.words.slice(0, maxindex);
	
							        //data1.markers = venuemarkers;
									data1.userdiscussiontable = userDiscussionJsonData;
									fn(null, data1);
								}
							}
							else{
								fn(null,null);
								console.log(err);
							
							}
			            });
					}
				});
				
				
			});

			
		}	

	});
	
	socket.on('user_venues_search', function(params, fn) {

		console.log("user_venues_search params:");
		for (var index in params)
			console.log("    params." + index + ": \"" + params[index] + "\"");
		
		// params.screenname
		// params.days
		// params.liveresults
		
		
		
		getUserIDAndScreenName(params.screenname, function(screennamesandids) {
			
			if(params.liveresults){

				currentTwitStream = twitterAPI.stream('statuses/filter', { follow: screennamesandids.user_id },function (stream) {
					var venues =[];
	                stream.on('data', function (data) {
	              
	                	console.log(data);
						user= data.user;
						
						venues = twitterFunctions.venues(data,venues);
	            		var returndata = {};
		
						returndata.user = user;
						returndata.markers = venues[0];
	
						if (data.coordinates)
				        {
					        returndata.markers = {};
					        returndata.markers.lat = data.coordinates.coordinates[1];
						    returndata.markers.long = data.coordinates.coordinates[0];
						    returndata.markers.label = "<h3>@" + data.user.screen_name + "</h3>" + data.text + "";
				        }
						
						returndata.visitedvenuestable = venues;
						//console.log(data);
	
	                    //console.log(data.user.screen_name + " : " + data.text);
	                    io.sockets.emit('stream_user_venues_search', returndata);
	                    // throw  new Exception('end');
	                
	
	                });
	                
	                twitterAPI.currentUserVenuesStream = stream;
	            });
				
				
				
	            
	            socket.on('user_venues_search_stop_stream', function(fn) {
		            
		            if (twitterAPI.currentUserVenuesStream != undefined) {
						twitterAPI.currentUserVenuesStream.destroy();
						twitterAPI.currentUserVenuesStream = undefined;
		            }
		            
		            return fn();
		      
		        });
		        
		        fn();
	
	
			}
			else{
				var	searchParams = { screen_name: screennamesandids.username, count: 200 };
				
				twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
	                if(!err){
		                
		                
		                //Remove any tweets that are before the specified number of days
			            //There is no way to use the api to do this, so manual clipping 
			            //is needed
			            if (params.days > 0)
			            	data = sliceOlderTweets(data, params.days);
		                
		            	var user;
	                	
	                	
						var venues =[];
		                for (var indx in data) {
		                	var currentData = data[indx];			

							var found;
							user = currentData.user;
							venues = twitterFunctions.venues(currentData,venues);
                		}

	
                		var venuemarkers = [];
	                	
	                	for (var indx in data)
			                if (data[indx].coordinates && data[indx].coordinates.coordinates) {
				                var tempmarker = {};
				                tempmarker.lat = data[indx].coordinates.coordinates[1];
						        tempmarker.long = data[indx].coordinates.coordinates[0];
						        tempmarker.label = "<h3>@" + data[indx].user.screen_name + "</h3>" + data[indx].text + "";
				                venuemarkers.push(tempmarker);
			                }
			                
			                	
						var data = {};
						
						data.user = user;
						data.markers = venuemarkers;
						data.visitedvenuestable = venues;

						fn(null, data);

					}
					else{

						fn(null,null);
						console.log(err);
					
					}
	            });
	
			}
				
				
				
					
		});
		
		
		
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

		if(params.liveresults){
			
			var	filterParams = { track: params.search };
			var bounds = getBoundingBox([params.lat, params.long], (params.radius));
		    filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
        	console.log(filterParams);
            var user;
            
			currentTwitStream = twitterAPI.stream('statuses/filter', filterParams,function (stream) {

				var venues =[];
				var usersList =[];
				
				
                stream.on('data', function (data) {
                	console.log(data);
					user= data.user;
					venues = twitterFunctions.venues(data,venues);
					usersList = twitterFunctions.users(data.user, usersList);
            		var returndata = {};
					
					if (data.coordinates)
			        {
				        returndata.markers = {};
				        returndata.markers.lat = data.coordinates.coordinates[1];
					    returndata.markers.long = data.coordinates.coordinates[0];
					    returndata.markers.label = "<h3>@" + data.user.screen_name + "</h3>" + data.text + "";
			        }
					
					returndata.visitedvenuestable = usersList;

                    io.sockets.emit('stream_venues_search', returndata);

                });
                
                twitterAPI.currentVenuesStream = stream;
            });

            
            socket.on('venues_search_search_stop_stream', function(fn) {
	            
	            if (twitterAPI.currentVenuesStream != undefined) {
					twitterAPI.currentVenuesStream.destroy();
					twitterAPI.currentVenuesStream = undefined;
	            }
	            
	            return fn();
	      
	        });
	        
	        fn();

		}
		else{
			var searchParams;
				searchParams = { q:params.search , geocode: [params.lat, params.long, params.radius + "mi"], count: 200 };
				
				//searchParams = { q: "iPhone", count: 200 };

			    twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
	                if(!err){

		            	//Remove any tweets that are before the specified number of days
			            //There is no way to use the api to do this, so manual clipping 
			            //is needed
			            if (params.days > 0)
			             data = sliceOlderTweets(data, params.days);
		             
	                	var venues =[];
	                    var usersList =[];
	                    //console.log("data:" +data[0]);
		        			for (var indx in data.statuses) {
		        				var currentData = data.statuses[indx];
								usersList = twitterFunctions.users(currentData.user, usersList);
				                venues = twitterFunctions.venues(currentData,venues);
                    		}
                    		var data = {};
                    		data.visitedvenuestable = usersList;


		                    var venuemarkers = [];
			        		for (var indx in venues)
			                	if (venues[indx].lat && venues[indx].long)
			                		venuemarkers.push(venues[indx]);



                    		data.markers = venuemarkers;
                    		fn(null, data);
                    		
				}
				else{

					console.log(err);
					fn(null,null);
				}
            });
		}
			
		
	});
	
	socket.on('get_user_and_tweets', function(user_id, fn) {

		console.log("get_user_and_tweets id: " + user_id);
		
		var data = {};
		data.user = exampleUserJson;
		data.markers = exampleMarkerJson;
		data.tweets = [exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1, exampleTweetJson_1];

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
	
	socket.on('database_get_users_at_venue', function(tweet_id, fn) {

		console.log("get_tweet_replies id: " + tweet_id);
		
		var data = {};
		data.location_name = "TODO: Location name goes here";
		data.databaseusertable = databaseUserJson;

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
	
});

function getUserIDsAndScreenNames(users, callback){
	var userIDs = [];
	users.forEach(function(user,next){
		var tempuser = user;
		
		// Check to see if we already have a an id
		if (!isNaN(parseFloat(tempuser)) && isFinite(tempuser)) {
			
			asyncGetUserScreenName(tempuser, function(screenName){
				userIDs.push({"username": screenName, "user_id": tempuser});
				
				if(users.length == userIDs.length) {
					callback(userIDs);
				}
			});
			
		} else {
			
			asyncGetUserID(user, function(userID){
				userIDs.push({"username": tempuser, "user_id": userID});
				
				if(users.length == userIDs.length) {
					callback(userIDs);
				}
			});
			
		}		 
				
	});
}

function getUserIDAndScreenName(user, callback){
	// Check to see if we already have a an id
	if (!isNaN(parseFloat(user)) && isFinite(user)) {
		
		asyncGetUserScreenName(user, function(screenName){
			callback({"username": screenName, "user_id": user});
		});
		
	} else {
		
		asyncGetUserID(user, function(userID){
			
			callback({"username": user, "user_id": userID});
		});
		
	}
}

function asyncGetUserID(user, callback){

	twitterRestAPI.get('users/show', {screen_name: user}, function(err, data, response ) {
		
		if(!err)
	    	callback(data.id);
	    else
			console.log(err);

	});
}

function asyncGetUserScreenName(id, callback){

	twitterRestAPI.get('users/show', {user_id: id}, function(err, data, response ) {
		
		if(!err)
	    	callback(data.screen_name);
	    else
			console.log(err);
		
	});
}

function getBoundingBox(centerPoint, distance) {
	
	var GeoPoint = require('geopoint'),
    point = new GeoPoint(parseFloat(centerPoint[0]), parseFloat(centerPoint[1]));
	
	coordinates = point.boundingCoordinates(distance* 1.60934, true);
	
	return [coordinates[0]["_degLat"], coordinates[0]["_degLon"], coordinates[1]["_degLat"], coordinates[1]["_degLon"]];
	
}

function parseTwitterDate(aDate) {   
	return new Date(Date.parse(aDate.replace(/( \+)/, ' UTC$1')));
}

function sliceOlderTweets(data, days) {
	var xdaysago = new Date();
	xdaysago.setDate(xdaysago.getDate() - days);
	
	for (var i = data.length - 1; i >= 0; i--){
		var creationDate = parseTwitterDate(data[i].created_at);
		
		if (creationDate < xdaysago)
			data = data.slice(0, i);
	}
	
	return data;
}

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
