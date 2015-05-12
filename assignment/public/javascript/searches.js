

//var socket = io.connect('http://localhost:3001');
//    window.socket = socket;
//    socket.on('newTwitt', function (item) {
//
//        appendTweetWithAccount($("#discussion_tweet_return"), item);
//
//        /*$scope.twitts.push(item);
//
//        $scope.count++;
//
//        //console.log(item);
//        if ($scope.twitts.length > 15)
//            $scope.twitts.splice(0, 1);
//        $scope.$apply();*/
//
//    })
    
function getFormData(element) {
    var formData = {};
    element.find('[name]').each(function() {

	    if ($(this).is('[type=checkbox]'))
	    	formData[this.name] = $(this).is(':checked');
	    else if ($(this).is('[type=radio]')) {
		    if ($(this).is(':checked')) {
		    	formData[this.name] = $(this).attr('value'); 
	    	}
	    }	
	    else
		    formData[this.name] = this.value;
		      
    });
    
    return formData;
};

$(function(){
	
	
	// When the number of days on a form is set to 0 or less, enable live results,
	// otherwise, disable them
	$("[name='days']").on("keyup", function () {
		if (parseInt($(this).val()) <= 0 || parseInt($(this).val()) == NaN)
			$(this).parent().parent().parent().parent().parent().find("[name='liveresults']").prop('checked', true);
		else
			$(this).parent().parent().parent().parent().parent().find("[name='liveresults']").prop('checked', false);
	});
	
	// When the live results is enabled in a form, set the number of days to 0.
	// If it is disabled, make sure the number is not below 0
	$("[name='liveresults']").click(function () {
		
		if ($(this).is(':checked')) {
			$(this).parent().parent().parent().parent().parent().parent().find("[name='days']").val('0');
		} else {
			if (parseInt($(this).parent().parent().parent().parent().parent().parent().find("[name='days']").val()) <= 0)
				$(this).parent().parent().parent().parent().parent().parent().find("[name='days']").val('5');
		}
			
	});
	
	// Discussion search
	$("#discussion_search_form").submit(function(e){
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#discussion_tweet_return, #discussion_location_return").html("");
			
			socket.emit('discussion_search', getFormData($(this)), function (err, data) {
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					
					// Use the streaming API
					if ($("#discussion_search_form input[name=liveresults]").is(':checked')) {
						
						
						$("#discussion_search_form").addClass("live_steaming");
						
						$("#discussion_search_form tr.stop_streaming .button").click(function () {
							
							// Stop the streaming
							socket.emit('discussion_search_stop_stream', function() {
								$("#discussion_search_form").removeClass("live_steaming");
							});
							
							e.preventDefault();
							return false;
						});
						
						var map = appendLocation($("#discussion_location_return"), []);
						
						var newBounds = true;
						
						socket.on('stream_discussion_search', function (data) {
							if (data.marker) {
								
								addMarkerToMap(map, data.marker.lat, data.marker.long, data.marker.label, newBounds);
								
								
								
								newBounds = false;
							}
							appendTweetWithAccount($("#discussion_tweet_return"), data.tweet, true);
						});
						
					// Use the REST API	
					} else {
						
						addNotification("Discussion search", "Search successful", 5000);
					
						appendLocation($("#discussion_location_return"), data.markers);
					
						for (i=0;i<data.tweets.length;i++)
							appendTweetWithAccount($("#discussion_tweet_return"), data.tweets[i]);
						
						scrollToElement($("#discussion_location_return"));
						
					}
						
				}
				
			});
		
		}
		
		e.preventDefault();
	    return false;
	});

	// User discussion search
	$("#user_discussion_search_form").submit(function(e){
		
		// TODO: Add in AJAX request to the server for the json information and then use the functions below
		// in order to push the data to the front end.
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#user_discussion_table_return, #user_discussion_location_return").html("");
			
			socket.emit('user_discussion_search', getFormData($(this)), function (err, data) {
				
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					
					if ($("#user_discussion_search_form input[name=liveresults]").is(':checked')) {
						// Streaming
						
						$("#user_discussion_search_form").addClass("live_steaming");
						
						addNotification("User discussion search", "Search stream started", 5000);
					
						
						$("#user_discussion_search_form tr.stop_streaming .button").click(function () {
							$("#user_discussion_search_form").removeClass("live_steaming");
							
							// Stop the streaming here
							socket.emit('user_discussion_search_stop_stream', function() {
								$("#user_discussion_search_form").removeClass("live_steaming");
							});
							
							e.preventDefault();
							return false;
						});
						
						
						var map = appendLocation($("#user_discussion_location_return"), []);
						
						var newBounds = true;
						socket.on('stream_user_discussion_search', function (data) {
						
							
						
							$('.tweet_results_table').remove();
						
							mostUsedWordsTable($("#user_discussion_table_return"), data.userdiscussiontable);
						
							if (data.marker) {
								addMarkerToMap(map, data.marker.lat, data.marker.long, data.marker.label, newBounds);
								newBounds = false;
							}
							
							
							
							
						});
						
					} else {
						// Not streaming
						
						//console.log(data);
						
						addNotification("User discussion search", "Search successful", 5000);
					
						$("#user_discussion_table_return").append("<hr><h1>Tweets</h1>");
					
						mostUsedWordsTable($("#user_discussion_table_return"), data.userdiscussiontable);
		
						appendLocation($("#user_discussion_location_return"), data.markers);
						
						scrollToElement($("#user_discussion_table_return"));
						
					}
						
				}
				
			});
		
		}
		
		e.preventDefault();
	    return false;
		
	});

	// User venue search
	$("#user_venues_search_form").submit(function(e){
		
		// TODO: Add in AJAX request to the server for the json information and then use the functions below
		// in order to push the data to the front end.
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#user_venues_return, #user_venues_location_return").html("");
			
			socket.emit('user_venues_search', getFormData($(this)), function (err, data) {
				
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					
					if ($("#user_venues_search_form input[name=liveresults]").is(':checked')) {
						// Streaming
						
						$("#user_venues_search_form").addClass("live_steaming");
						
						$("#user_venues_search_form tr.stop_streaming .button").click(function () {
							$("#user_venues_search_form").removeClass("live_steaming");
							
							// Stop the streaming here
							socket.emit('user_venues_search_stop_stream', function() {
								$("#user_venues_search_form").removeClass("live_steaming");
							});
							
							e.preventDefault();
							return false;
						});
						
						
						
						
						var map = appendLocation($("#user_venues_location_return"), []);
						var newBounds = true;
						
						
						
						
						socket.on('stream_user_venues_search', function (data) {
							
							$("#user_venues_return").html("<hr><h1>User venues</h1>Here are the venues for <a href=\"http://www.twitter.com/" + data.user.screen_name + "\">@" + data.user.screen_name + "</a><br><a href=\"javascript:void(0)\" onclick=\"getUserAndTweets('" + data.user.screen_name + "')\">View user's profile and Tweets</a>");
					
							visitedVenues($("#user_venues_return"), data.visitedvenuestable);
						
							if (data.markers) {
								addMarkerToMap(map, data.markers.lat, data.markers.long, data.markers.label, newBounds);
								newBounds = false;
							}
							
						});
						
						
					} else {
						// Not streaming
						
						addNotification("User venues search", "Search successful", 5000);
					
						//console.log(data);
					
						$("#user_venues_return").html("<hr><h1>User venues</h1>Here are the venues for" +
						
						'<span xmlns:assignment="http://127.0.0.1/rdf/rdf.xml">'+
							'<span about="http://127.0.0.1:3000/twitteruser/data.rdf#' + data.user.screen_name + '" typeof="assigment:twitterUser">' +
								'<a href="http://www.twitter.com/' + data.user.screen_name + '">@' + data.user.screen_name + '</a>' +
								'<span style="display:none;" property="assigment:screenName">' + data.user.screen_name + '</span>' +
								'<span style="display:none;" property="assigment:id">' + data.user.id_str + '</span>' +
								'<span style="display:none;" property="assigment:location">' + data.user.location + '</span>' +
								'<span style="display:none;" property="assigment:profilePicture">' + data.user.profile_image_url + '</span>' +
								'<span style="display:none;" property="assigment:realName">' + data.user.name + '</span>' +
							'</span>' +
								
						'</span>'+
						
						"<br><a href=\"javascript:void(0)\" onclick=\"getUserAndTweets('" + data.user.screen_name + "')\">View user's profile and Tweets</a>" +
						
						"<br><div><span class=\"extra\">Extra</span> <a style=\"display: inline-block;\" href=\"persistentqueries/" + data.queryid + "\" target=\"_blank\" class=\"button\">Persitent file with RDFa</a></div>");
					
						visitedVenues($("#user_venues_return"), data.visitedvenuestable);
						
						appendLocation($("#user_venues_location_return"), data.markers);
						
						scrollToElement($("#user_venues_return"));
						
					}
	
				}
				
			});
			
		}
		
		e.preventDefault();
	    return false;
	});

	// Venue search
	$("#venue_search_form").submit(function(e){
		
		// TODO: Add in AJAX request to the server for the json information and then use the functions below
		// in order to push the data to the front end.
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#venue_return, #venue_return_location_return").html("");
			
			socket.emit('venue_search', getFormData($(this)), function (err, data) {
				
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					
					if ($("#venue_search_form input[name=liveresults]").is(':checked')) {
						// Streaming
						
						$("#venue_search_form").addClass("live_steaming");
						
						$("#venue_search_form tr.stop_streaming .button").click(function () {
							$("#venue_search_form").removeClass("live_steaming");
							
							// Stop the streaming here
							socket.emit('venues_search_search_stop_stream', function() {
								$("#venue_search_form").removeClass("live_steaming");
							});
							
							e.preventDefault();
							return false;
						});
						
						var map = appendLocation($("#venue_return_location_return"), []);
						var newBounds = true;
				
						
						socket.on('stream_venues_search', function (data) {
							
							
							$("#venue_return").html("<hr><h1>Users at venue</h1><span>Here are the users that have been found in the search area</span>");
							
							mostVisitedVenues($("#venue_return"), data.visitedvenuestable);
						
							if (data.markers) {
								addMarkerToMap(map, data.markers.lat, data.markers.long, data.markers.label, newBounds);
								newBounds = false;
							}
							
						});

						
					} else {
						// Not streaming
						
						addNotification("Venue search", "Search successful", 5000);
					
						$("#venue_return").html("<hr><h1>Users at venue</h1><span>Here are the users that have been found in the search area</span>");
						
						
					
						mostVisitedVenues($("#venue_return"), data.visitedvenuestable);
						
						appendLocation($("#venue_return_location_return"), data.markers);
						
						scrollToElement($("#venue_return_location_return"));
							
					}
					
				}
				
			});
		
		}
		
		e.preventDefault();
	    return false;
	});
	
	// User database search
	$("#database_user_form").submit(function(e){
		
		// TODO: Add in AJAX request to the server for the json information and then use the functions below
		// in order to push the data to the front end.
		
		/////////////////////////////
		// User database imitation //
		/////////////////////////////
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#database_user_table_return").html("");
			
			socket.emit('database_user_search', getFormData($(this)), function (err, data) {
				
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					addNotification("Database user search", "Search successful", 5000);
					
					databaseUserTable($("#database_user_table_return"), data.databaseusertable);
					
					scrollToElement($("#database_user_table_return"));
					
				}
				
			});
		
		}
		
		e.preventDefault();
	    return false;
	});
	
	// venue database search
	$("#database_venue_form").submit(function(e){
		
		// TODO: Add in AJAX request to the server for the json information and then use the functions below
		// in order to push the data to the front end.
		
		//////////////////////////////
		// Venue database imitation //
		//////////////////////////////
		
		loadingOverlay(true);
		
		if (ValidateForm($(this))) {
		
			$("#database_venue_table_return").html("");
			
			socket.emit('database_venue_search', getFormData($(this)), function (err, data) {
				
				
				loadingOverlay(false);
				
				if (err != null) {				
					addNotification("Error", err, 5000);
				} else {
					addNotification("Database venue search", "Search successful", 5000);
					
					databaseVenueTable($("#database_venue_table_return"), data.databasevenuetable);
				
					scrollToElement($("#database_venue_table_return"));
					
				}
				
			});
			
		}
		
		e.preventDefault();
	    return false;
	});
});

function scrollToElement(element) {
	$('html, body').animate({
        scrollTop: element.offset().top - 100
    }, 500);
}

// Gets a list of users from the database
function getDatabaseUserAtVenue(venue,name,foursquare) {
	
	// TODO: Get tweets from AJAX and and them into the form before it opens
	
	toggleAlternatePanel(true);
	
	loadingOverlay(true);
	
	socket.emit('database_get_users_at_venue', venue,name,foursquare, function (err, data) {
		
		loadingOverlay(false);
		
		if (err != null) {				
			addNotification("Error", err, 5000);
		} else {
			addNotification("Database: Users at venue", "Table recieved", 5000);
			
			setupVenueUsersDatabasePage(data);

			databaseVenueTable($("#database_venue_table_return"), data.databasevenuetable);
			
		}
		
	});
	
}

// Gets a user and their tweets
function getDatabaseUserAndTweets(user_id) {
	
	// TODO: Get tweets from AJAX and and them into the form before it opens
	
	toggleAlternatePanel(true);
	
	loadingOverlay(true);

	socket.emit('database_get_user_and_tweets', user_id, function (err, data) {

		loadingOverlay(false);
		
		if (err != null) {				
			addNotification("Error", err, 5000);
		} else {
			addNotification("Database: User and tweets", "Data recieved", 5000);
			
			setupUserDatabasePage(data.user);

			appendLocation($("#user_database_tweet_location_return"), data.markers);
			
			for (i = 0; i < data.tweets.length; i++)
				appendTweetWithoutAccount($("#user_tweet_return"), data.tweets[i]);
			//databaseTweetTable($("#user_tweet_return"), data);
			//databaseTweetTable(data);
		}
		
	});

	
}

// Gets a user and their tweets
function getUserAndTweets(user_id) {
	
	// TODO: Get tweets from AJAX and and them into the form before it opens
	
	toggleAlternatePanel(true);
	
	loadingOverlay(true);
	
	socket.emit('get_user_and_tweets', user_id, function (err, data) {
		
		loadingOverlay(false);
		
		if (err != null) {				
			addNotification("Error", err, 5000);
		} else {
			addNotification("User and tweets", "Data recieved", 5000);
			
			setupUserPage(data.user);
			appendLocation($("#user_tweet_location_return"), data.markers);
			
			for (i = 0; i < data.tweets.length; i++)
				appendTweetWithoutAccount($("#user_tweet_return"), data.tweets[i]);
			
		}
		
	});
	
}

function getPointsOfInterest(name, lat, long) {
	
	// TODO: Get tweets from AJAX and and them into the form before it opens
	
	toggleAlternatePanel(true);
	
	loadingOverlay(true);
	
	socket.emit('get_points_of_interest', name, lat, long, function (err, data) {
		
		loadingOverlay(false);
		
		if (err != null) {				
			addNotification("Error", err, 5000);
		} else {
			addNotification("Points of interest", "Data recieved", 5000);
			
			setupVenuePage(data);
			
			POITable($("#poi_venue_location_table_return"), data);
			
			for (var indx in data.venues)
				data.venues[indx].label = "<h3>" + data.venues[indx].label + "</h3><a href='" + data.venues[indx].link + "' target='_blank'>" + data.venues[indx].link + "</a>";
			
			appendLocation($("#poi_venue_location_return"), data.venues);

			
		}
		
	});
	
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