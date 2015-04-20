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
			currentTwitStream = twitterAPI.stream('statuses/filter', filterParams,function (stream) {
				
                

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
	                if(!err){
	                	var venues =[];
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
				}
				else{
					fn(null,null);
					console.log(err);
				}
            })
		}
		
	});
	
	socket.on('user_discussion_search', function(params, fn) {

		console.log("user_discussion_search params:");
		
		// params.search
		// params.liveresults
		// params.uselocation
		// params.radius
		// params.lat
		// params.long
		
		for (var index in params) {
			console.log("    params." + index + ": \"" + params[index] + "\"");
		}
		//console.log("amount of key workds : "+ params.keywords);
		var data1 = {};
		
		// Use streaming API
		
		filterParams = {};
		
		if (params.search != '')
		  
		
		if (params.uselocation) {
		  var bounds = getBoundingBox([params.lat, params.long], params.radius);
		  filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
		  console.log(bounds);
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
			
			getUserIDs(users,function(callback){
				console.log(callback);
				filterParams['follow'] = callback;
				////////////////

				//var newString = userIDString.substr(0, userIDString.length-1);

        		
					currentTwitStream = twitterAPI.stream('statuses/filter', filterParams,function (stream) {

		                stream.on('data', function (data) {
		       
		                    tempData.tweet = data;
		                    // Its geotaggggeddd! Yaaaay
		              		venues = twitterFunctions.venues(data,venues);

		                    keyWords.addWords(data.user.screen_name, data.text);
		          			
							userDiscussionJsonData = keyWords.topKeyWords(params.keywords,screennames);
					        console.log(data);
				            data1.markers = venues;
							data1.userdiscussiontable = userDiscussionJsonData;
		                  	console.log(data1.userdiscussiontable);

		                    io.sockets.emit('stream_user_discussion_search', data1);
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






////////////////
			});
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
			var users = params.screennames.replace(/\s/g, '').split(",");
			

			var data1 = {};
			keyWords.reset();
			var counter = 0;
			users.forEach(function(userMan){

				var searchParams;
				//console.log(userMan);
				if(params.uselocation){
					searchParams = { screen_name: userMan, geocode: [params.lat, params.long, params.radius + "mi"],since_id:params.days, count: 200 };

				}
				else{
					searchParams = { screen_name: userMan,since_id:params.days, count: 200 };
					
				}
				if(searchParams){
				
					twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {

					
		                if(!err){
				        	var venues =[];
			                for (var indx in data) {
			                	var currentData = data[indx];

								keyWords.addWords(currentData.user.screen_name, currentData.text);
						
			                	venues = twitterFunctions.venues(currentData,venues);
			             
                    		}
                    		counter += 1;
                    		
						//A Node walkaround to return data only when finished
							if(counter == users.length){
									
									userDiscussionJsonData = keyWords.topKeyWords(params.keywords,users);
									var venuemarkers = [];
			                		for (var indx in venues)
					                	if (venues[indx].lat && venues[indx].long)
					                		venuemarkers.push(venues[indx]);

						            data1.markers = venuemarkers;
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
		if(params.liveresults){
			//var	filterParams = {track:params.screenname};
			var	filterParams = {screen_name :params.screenname};
			console.log(filterParams);
			
        	twitterRestAPI.get('users/show', filterParams, function(err, data, response) {
        		if(!err){
        		var userid = data.id;
        			currentTwitStream = twitterAPI.stream('statuses/filter', { follow: userid },function (stream) {
						var venues =[];
		                stream.on('data', function (data) {
		              
		                	console.log(data);
							user= data.user;
							
							venues = twitterFunctions.venues(data,venues);
		            		var data = {};
			
							data.user = user;
							data.markers = venues[0];
							data.visitedvenuestable = venues;
							//console.log(data);

		                    //console.log(data.user.screen_name + " : " + data.text);
		                    io.sockets.emit('stream_user_venues_search', data);
		                    // throw  new Exception('end');
		                

		                });
		                
		                twitterAPI.currentUserVenuesStream = stream;
		            });
    			}
    			else{
    				console.log(err);
    			}
			});
            
            socket.on('discussion_search_stop_stream', function(fn) {
	            
	            if (twitterAPI.currentUserVenuesStream != undefined) {
					twitterAPI.currentUserVenuesStream.destroy();
					twitterAPI.currentUserVenuesStream = undefined;
	            }
	            
	            return fn();
	      
	        });
	        
	        fn();


		}
		else{
			var	searchParams = { screen_name: params.screenname,since_id:params.days, count: 200 };
			if(searchParams){
				twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
	                if(!err){
		               var user;
	                	
	                	
						var venues =[];
		                for (var indx in data) {
		                	var currentData = data[indx];			

							var found;
							user= currentData.user;
							venues = twitterFunctions.venues(currentData,venues);
                		}
                		var data = {};

                		console.log(venues);
						
                		var venuemarkers = [];
                		for (var indx in venues)
		                	if (venues[indx].lat && venues[indx].long)
		                		venuemarkers.push(venues[indx]);

						data.user = user;
						data.markers = venuemarkers;
						data.visitedvenuestable = venues;
						//console.log(data);
						fn(null, data);
                		
					//A Node walkaround to return data only when finished

					}
					else{

						fn(null,null);
						console.log(err);
					
					}
	            });
			}
		}
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
                stream.on('data', function (data) {
                	console.log(data);
					user= data.user;
					venues = twitterFunctions.venues(data,venues);
            		var data = {};
	
					data.user = user;
					data.markers = venues[0];
					data.visitedvenuestable = venues;

                    io.sockets.emit('stream_venues_search', data);
                    //fn(null, data);
                    // throw  new Exception('end');
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
var getUserIDs = function(users, callback){
	var userIDs = [];
	users.forEach(function(user,next){
				console.log(user);
				 asyncGetUserID(user, function(userID){
					userIDs.push(userID);
					if(users.length == userIDs.length) {
     			 		callback(userIDs);
     			 		//console.log(userIDs);

     				}
				});
				
	});
}
function asyncGetUserID(user, callback){

	twitterRestAPI.get('users/show', {screen_name: user}, function(err, data, response ) {
		
		callback(data.id);

	});
}
