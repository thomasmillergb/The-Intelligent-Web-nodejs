var Twit = require('twit');
var twitter = require('ntwitter');
var foursqaure = require('../foursqaure/main.js');
//var keyWords = require('./keywords.js');
var keyword_extractor = require("keyword-extractor");
var twitterFunctions = require('./twitterFunction.js');

var mySQL = require('../mySQL/main.js')
var twitterAPI;
var twitterRestAPI;
var SparqlClient = require('sparql-client');
var util = require('util');



var io = require('socket.io').listen(3001, {
	log: false
});

io.on('connection', function(socket) {
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
		twitterAPI.verifyCredentials(function(err, data) {
			if (err) {
				fn('There was a problem verifiying your Twitter credentials.<br>' + err);
			} else {
				fn('Connection to Twitter was succesfull!');
			}
		});


	});
	socket.on('foursqaure_tokens', function(token, fn) {
		four_token =  token;
		fn('Connection to Foursqaure was succesfull!');
	});
	socket.on('discussion_search', function(params, fn) {
		console.log("discussion_search params:");
		console.log(params);
		// params.search
		// params.liveresults
		// params.uselocation
		// params.radius
		// params.lat
		// params.long
		var data = {};
		// Use streaming API
		filterParams = {};
		if (params.search != '') filterParams["track"] = [params.search];
		var bounds;
		if (params.uselocation) {
			bounds = getBoundingBox([params.lat, params.long], params.radius);
			//filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
		}
		if (params.liveresults) {
			console.log(filterParams);
			currentTwitStream = twitterAPI.stream('statuses/filter', filterParams, function(stream) {
				console.log(bounds);
				stream.on('data', function(data) {
					if (!params.uselocation || (params.uselocation && data.coordinates && data.coordinates.coordinates[1] >= bounds[0] && data.coordinates.coordinates[1] <= bounds[2] && data.coordinates.coordinates[
						0] >= bounds[1] && data.coordinates.coordinates[0] <= bounds[3])) {
						var tempData = {};
						tempData.tweet = data;
						tempData.marker = [];
						// Its geotaggggeddd! Yaaaay
						tempData.marker = twitterFunctions.venues(data, tempData.marker)[0];
						io.sockets.emit('stream_discussion_search', tempData);
						// throw  new Exception('end');
					}
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
			if (params.uselocation) searchParams = {
				q: params.search,
				geocode: [params.lat, params.long, params.radius + "mi"],
				count: 200
			};
			else searchParams = {
				q: params.search,
				count: 200
			};
			twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
				if (!err) {
					var venues = [];

					
					for (var indx in data.statuses) {
						var currentData = data.statuses[indx];
						venues = twitterFunctions.venues(currentData, venues);
		

					}
					var venuemarkers = [];
					for (var indx in venues)
						if (venues[indx].lat && venues[indx].long) venuemarkers.push(venues[indx]);
					data.markers = venuemarkers;
					data.tweets = data.statuses;
					mySQL.insertTwitterData(data.statuses,function(){
						mySQL.insertFourSqaureFromTwitterData(data.statuses,four_token);
					});
					fn(null, data);
				} else {
					fn(null, null);
					console.log(err);
				}
			});
		}
	});
	socket.on('user_discussion_search', function(params, fn) {
		console.log("user_discussion_search params:");
		console.log(params);
		// params.screennames
		// params.keywords
		// params.days
		// params.liveresults
		// params.uselocation
		// params.radius
		// params.lat
		// params.long
		var data1 = {};
		// Use streaming API
		if (params.liveresults) {
			var screennames = [];
			var tempData = {};
			var userDiscussionJsonData = {};
			userDiscussionJsonData.users = [];
			var countOfUsers = 0;
			var venues = [];
			var userIDString = "";
			var users = params.screennames.replace(/\s/g, '').split(",");
			var filterParams = {};
			if (params.uselocation) {
				var bounds = getBoundingBox([params.lat, params.long], params.radius);
				filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
			}
			getUserIDsAndScreenNames(users, function(screennamesandids) {
				filterParams['follow'] = [];
				for (var i = 0; i < screennamesandids.length; i++) filterParams['follow'].push(screennamesandids[i].user_id);
				currentTwitStream = twitterAPI.stream('statuses/filter', filterParams, function(stream) {
					var keywordsTable = {};
					keywordsTable['users'] = [];
					for (var i = 0; i < screennamesandids.length; i++) keywordsTable['users'].push(screennamesandids[i]);
					keywordsTable['words'] = [];
					stream.on('data', function(data) {
						keywordsTable = addKeywordToTable(keywordsTable, data.user.id, data.text);//.toLowerCase().split(" ")
						var tempdata = {};
						var maxindex = params.keywords;
						if (maxindex > keywordsTable.length) maxindex = keywordsTable.length;
						tempdata.userdiscussiontable = {};
						tempdata.userdiscussiontable.users = keywordsTable.users;
						tempdata.userdiscussiontable.words = keywordsTable.words.slice(0, maxindex);
						
						
						mySQL.insertTwitterData(data,function(){
							mySQL.insertFourSqaureFromTwitterData(data,four_token);
						});
						
						if (data.coordinates) {
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
						//keyWords.reset();
					}
					return fn();
				});
				fn();
			});
		} else {
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
				var keywordsTable = {};
				keywordsTable['users'] = [];
				for (var i = 0; i < screennamesandids.length; i++) keywordsTable['users'].push(screennamesandids[i]);
				keywordsTable['words'] = [];
				userscreennames = [];
				for (var i = 0; i < screennamesandids.length; i++) userscreennames.push(screennamesandids[i].username);
				var data1 = {};
				data1.markers = []
				var counter = 0;
				userscreennames.forEach(function(userMan) {
					var searchParams;
					if (params.uselocation) {
						searchParams = {
							screen_name: userMan,
							geocode: [params.lat, params.long, params.radius + "mi"],
							count: 200
						};
					} else {
						searchParams = {
							screen_name: userMan,
							count: 200
						};
					}
					if (searchParams) {
						twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
							if (!err) {
								//Remove any tweets that are before the specified number of days
								//There is no way to use the api to do this, so manual clipping 
								//is needed
								if (params.days > 0) data = sliceOlderTweets(data, params.days);
								for (var i = 0; i < data.length; i++) {
									keywordsTable = addKeywordToTable(keywordsTable, data[i].user.id, data[i].text);
									if (data[i].coordinates) {
										var marker = {};
										marker.lat = data[i].coordinates.coordinates[1];
										marker.long = data[i].coordinates.coordinates[0];
										marker.label = "<h3>@" + data[i].user.screen_name + "</h3>" + data[i].text + "";
										data1.markers.push(marker);
									}
								}
								counter += 1;
								if (counter == userscreennames.length) {
									var maxindex = params.keywords;
									if (maxindex > keywordsTable.length) maxindex = keywordsTable.length;
									keywordsTable.words = keywordsTable.words.slice(0, maxindex);
									//data1.markers = venuemarkers;
									data1.userdiscussiontable = keywordsTable; //userDiscussionJsonData;
									mySQL.insertTwitterData(data,function(){
										mySQL.insertFourSqaureFromTwitterData(data,four_token);
									});
									fn(null, data1);
								}
							} else {
								fn(null, null);
								console.log(err);
							}
						});
					}
				});
			});
		}
	});

	function addKeywordToTable(keywordsTable, userid, words) {
		//words = words.toLowerCase().split(" ");
		//console.log(words);
		//Lemmalise apostrophies and get rid of non alphanum
		var striped = words.replace(/('[a-zA-Z])/g, "");
		striped = striped.replace(/[^a-zA-Z ]/g, "");
		striped = striped.replace(/(http(\w)*)/g, "");
		words = keyword_extractor.extract(striped, {
			language: "english",
			remove_digits: true,
			return_changed_case: true,
			remove_duplicates: false
		});
		var userindex = -1;
		for (var i = 0; i < keywordsTable['users'].length; i++)
			if (keywordsTable['users'][i].user_id == userid) userindex = i;
		words.forEach(function(tweetword) {
			var wordindex = -1;
			for (var i = 0; i < keywordsTable['words'].length; i++)
				if (keywordsTable['words'][i].word == tweetword) wordindex = i;
			if (wordindex == -1) {
				var tempword = {}
				tempword.word = tweetword
				tempword.occurences = []
				for (user in keywordsTable['users']) tempword.occurences.push(0);
				tempword.occurences[userindex] = +1;
				keywordsTable['words'].push(tempword); //{"word": tweetword, "occurences" : emptywords});
			} else keywordsTable.words[wordindex].occurences[userindex] = keywordsTable.words[wordindex].occurences[userindex] + 1;
		});
		keywordsTable['words'].sort(function(x, y) {
			var xtotal = eval(x.occurences.join('+'));
			var ytotal = eval(y.occurences.join('+'));
			var x0count = 0;
			var y0count = 0;
			for (var i = 0; i < x.occurences.length; ++i) {
				if (x.occurences[i] == 0) x0count++;
				if (y.occurences[i] == 0) y0count++;
			}
			if (x0count < y0count) return -1;
			if (x0count > y0count) return 1;
			if (xtotal < ytotal) return 1;
			if (xtotal > ytotal) return -1;
			return 0;
		});
		return keywordsTable;
	}
	socket.on('user_venues_search', function(params, fn) {
		console.log("user_venues_search params:");
		console.log(params);
		// params.screenname
		// params.twitterfoursquare
		// params.days
		// params.liveresults
		getUserIDAndScreenName(params.screenname, function(screennamesandids) {
			if (params.liveresults) {
				currentTwitStream = twitterAPI.stream('statuses/filter', {
					follow: screennamesandids.user_id
				}, function(stream) {
					var venues = [];
					stream.on('data', function(data) {
						var user = data.user;
						//params.foursqaure = true;
						
						if (params.twitterfoursquare == 'foursquare') {
							foursqaure.getVenues(data,four_token, function(checkIns) {
								if (checkIns != null) {
									mySQL.insertTwitterData(data,function(){
										mySQL.insertFourSqaureData(checkIns);
									});
									
									checkIns.forEach(function(checkinAndID, idx) {
										var checkin = checkinAndID.checkin;
										returndata = {};
										returndata.user = user;
										returndata.markers = {};
										returndata.markers.lat = checkin.venue.location.lat;
										returndata.markers.long = checkin.venue.location.lng;
										returndata.markers.label = "<h3>@" + checkin.user.firstName + " " + checkin.user.lastName + "</h3>" + checkin.shout + "";
										venues = foursqaure.venues(checkinAndID, venues);
										returndata.visitedvenuestable = venues;
										io.sockets.emit('stream_user_venues_search', returndata);
									});
								} else {
									console.log("fail");
								}
							});
						} else {
							mySQL.insertTwitterData(data,function(){
								mySQL.insertFourSqaureFromTwitterData(data,four_token);
							});
							
							//console.log(data);
							user = data.user;
							venues = twitterFunctions.venues(data, venues);
							var returndata = {};
							returndata.user = user;
							returndata.markers = venues[0];
							if (data.coordinates) {
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
						}
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
			} else {
				var searchParams = {
					screen_name: screennamesandids.username,
					count: 50
				};
				twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
					if (!err) {
						//Remove any tweets that are before the specified number of days
						//There is no way to use the api to do this, so manual clipping 
						//is needed
						if (params.days > 0) data = sliceOlderTweets(data, params.days);
						var user;
						var venues = [];
						var venuemarkers = [];

				
						//searchParams.foursqaure = true;
						if (params.twitterfoursquare == 'foursquare') {
							
							var dataoutput = {};
							if (data.length > 0)
							 dataoutput.user = data[0].user;

							 foursqaure.getVenues(data,four_token, function(checkIns) {
							 	//console.log(checkInArray);
						 		//var checkIns = checkInArray.checkin;
							 	if(checkIns != null && checkIns != [] && checkIns.length > 0){
							 		
							 		//console.log(checkIns);

							 		//console.log(data.user.id);

									mySQL.insertTwitterData(data,function(){
										mySQL.insertFourSqaureData(checkIns);
									});
									checkIns.forEach(function(checkinAndID, idx) {

										var checkin = checkinAndID.checkin;
										var tempmarker = {};
										tempmarker.lat = checkin.venue.location.lat;
										tempmarker.long = checkin.venue.location.lng;
										tempmarker.label = "<h3>@" + checkin.user.firstName + " " + checkin.user.lastName + "</h3>" + checkin.shout + "";
										venuemarkers.push(tempmarker);
										venues = foursqaure.venues(checkinAndID, venues);
										if (idx == checkIns.length - 1) {
											//dataoutput.user = checkin.firstName + " "+checkin.user.lastName;
											dataoutput.markers = venuemarkers;
											dataoutput.visitedvenuestable = venues;
											fn(null, dataoutput);
										}
									});
									
									
								}
								else{
									console.log("No Foursqaure checkIns");
									fn("No Foursqaure checkIns", null);

								}
								
							});

						} else {
							//
							mySQL.insertTwitterData(data,function(){
								mySQL.insertFourSqaureFromTwitterData(data,four_token);
							});
							for (var indx in data) {
								var currentData = data[indx];
								var found;
								user = currentData.user;
								venues = twitterFunctions.venues(currentData, venues);
							}
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
					} else {
						fn(null, null);
						console.log(err);
					}
				});
			}
		});
	});
	socket.on('venue_search', function(params, fn) {
		console.log("venue_search params:");
		console.log(params);
		// params.days
		// params.twitterfoursquare
		// params.liveresults
		// params.radius
		// params.lat
		// params.long


			if (params.liveresults) {
				var filterParams = {
					track: params.search
				};
				var bounds = getBoundingBox([params.lat, params.long], (params.radius));
				filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
				var user;


				currentTwitStream = twitterAPI.stream('statuses/filter', filterParams, function(stream) {
					var venues = [];
					var usersList = [];
					stream.on('data', function(data) {
						mySQL.insertTwitterData(data.statuses,function(){
							mySQL.insertFourSqaureFromTwitterData(data.statuses, four_token);
						});
						user = data.user;
						venues = twitterFunctions.venues(data, venues);
						usersList = twitterFunctions.users(data, usersList);
						var returndata = {};
						if (data.coordinates) {
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
			} else {
				var searchParams;
				params.search = "swarmapp.com/c/";
				searchParams = {
					q: params.search,
					geocode: [params.lat, params.long, params.radius + "mi"],
					count: 20
				};
						

				twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
					if (!err) {
						var venuemarkers = [];
						//Remove any tweets that are before the specified number of days
						//There is no way to use the api to do this, so manual clipping 
						//is needed

						if (params.days > 0) data = sliceOlderTweets(data, params.days);
						var returndata = {};
						if (params.twitterfoursquare == 'foursquare') {
							var dataoutput = {};
							var venues = [];
							if (data.statuses.length > 0){
							 foursqaure.getVenues(data.statuses,four_token, function(checkIns) {
							 	if(checkIns != null && checkIns != [] && checkIns.length > 0){
							
							 		mySQL.insertTwitterData(data,function(){
										mySQL.insertFourSqaureData(checkIns);
									});
									checkIns.forEach(function(checkinAndID, idx) {

										var checkin = checkinAndID.checkin;
										var tempmarker = {};
										tempmarker.lat = checkin.venue.location.lat;
										tempmarker.long = checkin.venue.location.lng;
										tempmarker.label = "<h3>@" + checkin.user.firstName + " " + checkin.user.lastName + "</h3>" + checkin.shout + "";

										venuemarkers.push(tempmarker);
										venues = foursqaure.userVenues(checkinAndID, venues);
										if (idx == checkIns.length - 1) {
											//dataoutput.user = checkin.firstName + " "+checkin.user.lastName;
											dataoutput.markers = venuemarkers;
											dataoutput.visitedvenuestable = venues;
											fn(null, dataoutput);
										}
									});
									
									
									
								}
								else{
									console.log("No Foursqaure checkIns");
									fn("No Foursqaure checkIns", null);

								}
								
							});
							}else{
									console.log("No Foursqaure checkIns");
									fn("No Foursqaure checkIns, try extending area", null);
							}
						} else{
						returndata.visitedvenuestable = [];
						for (var indx in data.statuses) returndata.visitedvenuestable = twitterFunctions.users(data.statuses[indx], returndata.visitedvenuestable);
						returndata.markers = [];
						for (var i = 0; i < data.statuses.length; i++) {
							if (data.statuses[i].coordinates) {
								var tempMarker = {};
								tempMarker.lat = data.statuses[i].coordinates.coordinates[1];
								tempMarker.long = data.statuses[i].coordinates.coordinates[0];
								tempMarker.label = "<h3>@" + data.statuses[i].user.screen_name + "</h3>" + data.statuses[i].text + "";
								returndata.markers.push(tempMarker);
							}
						}
						//data.markers = venuemarkers;
						fn(null, returndata);

					}
					} else {
						console.log(err);
						fn(null, null);
					}
				});
			}
		
	});
	socket.on('get_user_and_tweets', function(screenname, fn) {
		console.log("get_user_and_tweets screen_name: " + screenname);
		searchParams = {
			screen_name: screenname
		};
		var returndata = {};
		twitterRestAPI.get('users/show', searchParams, function(err, data, response) {
			if (!err) {
				returndata.user = data;
				twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
					if (!err) {
						returndata.markers = [];
						for (var i = 0; i < data.length; i++) {
							if (data[i].coordinates) {
								var tempMarker = {};
								tempMarker.lat = data[i].coordinates.coordinates[1];
								tempMarker.long = data[i].coordinates.coordinates[0];
								tempMarker.label = "<h3>@" + data[i].user.screen_name + "</h3>" + data[i].text + "";
								returndata.markers.push(tempMarker);
							}
						}
						returndata.tweets = data;
						fn(null, returndata);
					} else {
						console.log(err);
						fn(null, null);
					}
				});
			} else {
				console.log(err);
				fn(null, null);
			}
		});
	});
	
	socket.on('get_points_of_interest', function(name, lat, long, fn) {
		console.log("get_points_of_interest lat: " + lat + " long: " + long);
		
		var returnData = {};
		
		returnData.name = name;
		returnData.lat = lat;
		returnData.long = long;
		
		var endpoint = 'http://dbpedia.org/sparql';
		
		// Get the 20 nearest venues to the lat and long provided
		var query = 'PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>			     ' +
						'SELECT ?subject ?link ?image_link ?comment ?label ?lat ?long WHERE {					' +
						'															     ' +
						'	?subject geo:lat ?lat.									     ' +
						'	?subject geo:long ?long.								     ' +
						'	?subject rdfs:label ?label.								     ' +
						'	?subject rdfs:label ?distance.							     ' +
						'	?subject foaf:isPrimaryTopicOf ?link.						' +
						'	?subject foaf:depiction ?image_link.								' +
						'	?subject rdfs:comment ?comment.						     ' +
						'															     ' +
						'	FILTER(													     ' +
						'		xsd:double(?lat) - xsd:double(\'' + lat + '\') <= 0.05 &&	     ' +
						'		xsd:double(\'' + lat + '\') - xsd:double(?lat) <= 0.05 &&	     ' +
						'		xsd:double(?long) - xsd:double(\'' + long + '\') <= 0.05 &&    ' +
						'		xsd:double(\'' + long + '\') - xsd:double(?long) <= 0.05 &&    ' +
						'		lang(?label) = "en"									     ' +
						'	).														     ' +
						'}															     ' +
						'ORDER BY ASC((xsd:double(?lat) - xsd:double(\'' + lat + '\')) * (xsd:double(?lat) - xsd:double(\'' + lat + '\')) + (xsd:double(\'' + long + '\') - xsd:double(?long)) * (xsd:double(\'' + long + '\') - xsd:double(?long)))						 ' +
						'LIMIT 10';
		var client = new SparqlClient(endpoint);

		returnData.venues = [];
		var returnedsources = 0;
		
		
		foursqaure.getVenuesFromLocation(lat + ',' + long,four_token, function(err, venuedata) {
			if (err == null) {
				
				venuedata = JSON.parse(venuedata);
				
				for (var index in venuedata.response.venues) {
					
					var name = "";
					if (venuedata.response.venues[index].categories[0])
						name = venuedata.response.venues[index].categories[0].name;
					
					var link = "https://foursquare.com/v/" + venuedata.response.venues[index].id;
					if (venuedata.response.venues[index].url)
						link = venuedata.response.venues[index].url;      
          
          			var address = venuedata.response.venues[index].location.address + ', ' + venuedata.response.venues[index].location.postalCode + ', ' + venuedata.response.venues[index].location.country
					
					returnData.venues.push({'link': link, 'label': venuedata.response.venues[index].name, 'lat': venuedata.response.venues[index].location.lat.toFixed(6), 'long': venuedata.response.venues[index].location.lng.toFixed(6), 'image_link': 'none', 'category': name.substring(0,100), 'description':'', 'from': 'FourSqaure', 'address': address});
				}
				
				returnedsources++;
				
				if (returnedsources == 2)
					fn(null, returnData);
				
			} else {
				fn(err, null);
			}
		});

		client.query(query).execute(function(error, results) {
		
			if (!error) {
				for (var i = 0; i < results.results.bindings.length; i++) {
					
					var currentrow = results.results.bindings[i];
					
					returnData.venues.push({'link': currentrow.link.value, 'label': currentrow.label.value, 'lat': currentrow.lat.value, 'long': currentrow.long.value, 'image_link': currentrow.image_link.value,'category':'', 'description': currentrow.comment.value.substring(0,100), 'from': 'DBPedia'});
					
				}
				
				returnedsources++;
				
				if (returnedsources == 2)
					fn(null, returnData);
				
			} else {
				console.log(error);
				
		  	}
			
		});
		
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

function getUserIDsAndScreenNames(users, callback) {
	var userIDs = [];
	users.forEach(function(user, next) {
		var tempuser = user;
		// Check to see if we already have a an id
		if (!isNaN(parseFloat(tempuser)) && isFinite(tempuser)) {
			asyncGetUserScreenName(tempuser, function(screenName) {
				userIDs.push({
					"username": screenName,
					"user_id": tempuser
				});
				if (users.length == userIDs.length) {
					callback(userIDs);
				}
			});
		} else {
			asyncGetUserID(user, function(userID) {
				userIDs.push({
					"username": tempuser,
					"user_id": userID
				});
				if (users.length == userIDs.length) {
					callback(userIDs);
				}
			});
		}
	});
}

function getUserIDAndScreenName(user, callback) {
	// Check to see if we already have a an id
	if (!isNaN(parseFloat(user)) && isFinite(user)) {
		asyncGetUserScreenName(user, function(screenName) {
			callback({
				"username": screenName,
				"user_id": user
			});
		});
	} else {
		asyncGetUserID(user, function(userID) {
			callback({
				"username": user,
				"user_id": userID
			});
		});
	}
}

function asyncGetUserID(user, callback) {
	twitterRestAPI.get('users/show', {
		screen_name: user
	}, function(err, data, response) {
		if (!err) callback(data.id);
		else console.log(err);
	});
}

function asyncGetUserScreenName(id, callback) {
	twitterRestAPI.get('users/show', {
		user_id: id
	}, function(err, data, response) {
		if (!err) callback(data.screen_name);
		else console.log(err);
	});
}

function getBoundingBox(centerPoint, distance) {
	var GeoPoint = require('geopoint'),
		point = new GeoPoint(parseFloat(centerPoint[0]), parseFloat(centerPoint[1]));
	coordinates = point.boundingCoordinates(distance * 1.60934, true);
	return [coordinates[0]["_degLat"], coordinates[0]["_degLon"], coordinates[1]["_degLat"], coordinates[1]["_degLon"]];
}

function parseTwitterDate(aDate) {
	return new Date(Date.parse(aDate.replace(/( \+)/, ' UTC$1')));
}

function sliceOlderTweets(data, days) {
	var xdaysago = new Date();
	xdaysago.setDate(xdaysago.getDate() - days);
	for (var i = data.length - 1; i >= 0; i--) {
		var creationDate = parseTwitterDate(data[i].created_at);
		if (creationDate < xdaysago) data = data.slice(0, i);
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
