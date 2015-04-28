var socket;

var gmapsloaded = false;

$(window).load(function() {
    window.loaded = true;
});

// Changes the active tab
function activeTab(id) {
	//$('body').scrollTop(1000);
	
	$("#tab_container > div").css("display", "none");
	$('#' + id).css("display", "block");
	toggleAlternatePanel(false);
	
	window.location.hash = '#' + id;
}

// Opens child window in order to obtain API keys for Twitter
function twitterOAuth() {
	// open popup window and pass field id
	window.open('/auth/twitter', 'popuppage', 'width=600,toolbar=1,resizable=1,scrollbars=yes,height=400,top=100,left=100');
}

// Opens child window in order to obtain API keys for FourSquare
function fourOAuth() {
	// open popup window and pass field id
	window.open('/auth/foursqaure', 'popuppage', 'width=600,toolbar=1,resizable=1,scrollbars=yes,height=400,top=100,left=100');
}

// Toggles whether the client is focused on the user panel
function toggleAlternatePanel(show) {
	$('html, body').scrollTop(0);
	
	if (show) {
		$("#tab_container").addClass("hide");
		$("#alternate_panel_container").removeClass("hide");
		$("#alternate_panel_container").html("");
	}
	else {
		$("#tab_container").removeClass("hide");
		$("#alternate_panel_container").addClass("hide");
	}
	
}

// Callback function for Twitter child window
function setTwitterAuth(token, token_secret) {
	localStorage.setItem('twitter_token', token);
	localStorage.setItem('twitter_token_secret', token_secret);
	
	console.log('twitter_token: ' + token);
	console.log('twitter_token_secret: ' + token);
	
	haveTwitterAPITokens = true;
	
	setRestrictions();
	
	addNotification("Twitter API Login", "Logged into Twitter API succesfully.", 5000);
	
}

// Callback function for FourSquare child window
function SetFourAuth(token){
	localStorage.setItem('four_token', token);
	
	haveFourAPITokens = true;
	
	setRestrictions();
	
	addNotification("FourSquare API Login", "Logged into FourSquare API succesfully.", 5000);
}

// Unset the Twitter API tokens
function forgetTwitterAuth() {
	localStorage.removeItem('twitter_token');
	localStorage.removeItem('twitter_token_secret');
	
	haveTwitterAPITokens = false;
	
	setRestrictions();
	
	addNotification("Twitter API Logout", "Logged out of Twitter API.", 5000);
}

// Unset the FourSquare API tokens
function forgetFourAuth() {
	localStorage.removeItem('four_token');
	
	haveFourAPITokens = false;
	
	setRestrictions();
	
	addNotification("FourSquare API Logout", "Logged out of FourSquare API.", 5000);
}

// Checks to see if we have api tokens on page load
$(function(){
	
	if (localStorage.getItem("twitter_token") != null && localStorage.getItem("twitter_token_secret") != null)
		haveTwitterAPITokens = true;
	else
		haveTwitterAPITokens = false;
	
	if (localStorage.getItem("four_token") != null)
		haveFourAPITokens = true;
	else
		haveFourAPITokens = false;
	
	setRestrictions();
	
});


// Applies restrictions to forms so that they can not be used if the user has not obtained API tokens
function setRestrictions() {
	
	$("*").removeClass("validation_fail");
	
	if (haveTwitterAPITokens)
	{
	  $("body").removeClass("no_twitter");
	  $("body").addClass("twitter");
	  $("#twitter_api_button").addClass("check");
	}
	else
	{
	  $("body").addClass("no_twitter");
	  $("body").removeClass("twitter");
	  $("#twitter_api_button").removeClass("check");
	}
	  
	if (haveFourAPITokens)
	{
	  $("body").removeClass("no_four");
	  $("body").addClass("four");
	  $("#foursquare_api_button").addClass("check");
	}
	else
	{
	  $("body").addClass("no_four");
	  $("body").removeClass("four");
	  $("#foursquare_api_button").removeClass("check");
	}

	// Reset socket connection
	socket = io.connect('http://localhost:3001')

	if (haveTwitterAPITokens) {
		if (!socket.socket.connected)
			socket.on('connect', function () {
				socket.emit('twitter_tokens', localStorage.getItem("twitter_token"), localStorage.getItem("twitter_token_secret"), function(data) {
					addNotification("Twitter", data, 5000);
				});
			});
		else {
			socket.emit('twitter_tokens', localStorage.getItem("twitter_token"), localStorage.getItem("twitter_token_secret"), function(data) {
					addNotification("Twitter", data, 5000);
				});
		}	
	}

}

// Toggle functon for the loading overlay
function loadingOverlay(loading) {
	if (loading)
		$("body").addClass("loading");
	else
		$("body").removeClass("loading");
}

// Adds a notification to the screen that will eventually fade and delete
function addNotification(title, message, duration) {
	
	html = "<div class=\"notification\"><h4>" + title + "</h4>" + message + "</div>";
	
	var notification = $(html).appendTo('#notification_wrapper');
	
	timeout = setTimeout(function(){
		notification.animate({"opacity": 0, "height": "0px"}, 300, function() {
			$(this).remove();
			});
		}, duration);
	
	notification.click(function(){
		clearTimeout(timeout);
		notification.animate({"opacity": 0, "height": "0px"}, 300, function() {
			$(this).remove(); 
			});
		});

}

// Removes timezone from Twitter formatted date
function removeTimezone(str) {
	return str.replace(/\s\+\S+/ig,"");
}

// Appends a tweet to an element from the tweets json including the users account on the left
// Returns the created element
function appendTweetWithAccount(element, tweetJson, append) {
	
		if (append === undefined)
			append = false;
		
		var tweethtml ='<table class="tweet_table" id="' + tweetJson['id_str'] + '"><tr><td width="300px"><div class="profile_top clearfix"><img class="profile_image" src="' + tweetJson['user']['profile_image_url'].replace("_normal", "") + '" alt="' + tweetJson['user']['screen_name'] + '" height="100" width="100"><div class="name_wrapper"><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '" class="screen_name">' + tweetJson['user']['name'] + '</a><br><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a><br><br></div></div>';
					
					
					
		if (tweetJson['user']['location'] !== undefined && tweetJson['user']['location'] != null)
			tweethtml +='<span class="dark">Location</span> ' + tweetJson['user']['location'] + '<br>';
			
		if (tweetJson['user']['url'] !== undefined && tweetJson['user']['url'] != null)
			tweethtml +='<span class="dark">Website</span> <a href="' + tweetJson['user']['url'] + '">' + tweetJson['user']['url'] + '</a><br>';
		
		tweethtml +='<span class="dark">Joined</span> ' + removeTimezone(tweetJson['user']['created_at']) + '<br><br>';
		
		if (tweetJson['user']['description'] !== undefined && tweetJson['user']['description'] != null)
			tweethtml +='<span class="dark">' + tweetJson['user']['description'] + '</span><br><br>';
			
			
		tweethtml +='<a href="javascript:void(0)" onclick="getUserAndTweets(\'' + tweetJson['user']['screen_name'] + '\')">View user\'s profile and Tweets</a></td><td><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a> ' + removeTimezone(tweetJson['created_at']) + '<br><div class="tweet">' + tweetJson['text'] + '</div>' + tweetJson['retweet_count'] + ' Re-Tweets<br><br>';


		if (false) {
			if (tweetJson['geo'] !== undefined && tweetJson['geo']['coordinates'] !== undefined)
				tweethtml +='<div class="map_wrapper"><iframe width="100%" height="150" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=' + tweetJson['coordinates'][0] + ',' + tweetJson['coordinates'][1] + '&key=AIzaSyARRU-El139sH4_4DjiZIpCO4Z6qhCSTqw"></iframe></div>';
			else
				tweethtml += 'This tweet was not geotagged';
		}
		
		tweethtml +='</td></tr></table><hr>';
	
	if (append)
		returnelement = $(tweethtml).appendTo(element);
	else
		returnelement = $(tweethtml).prependTo(element);

		
	return returnelement;
}

// Appends a tweet to an element from the tweets json without their account
// Returns the created element
function appendTweetWithoutAccount(element, tweetJson) {
	
	var tweethtml = '<div class="white_container"><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a> ' + removeTimezone(tweetJson['created_at']) + '<br><div class="tweet">' + tweetJson['text'] + '</div>' + tweetJson['favourites_count'] + ' Favourites, ' + tweetJson['retweet_count'] + ' Re-Tweets<br>';
	
	if (false) {
		if (tweetJson['geo'] !== undefined && tweetJson['geo']['coordinates'] !== undefined)
			tweethtml +='<br><div class="map_wrapper"><iframe width="100%" height="150" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=' + tweetJson['coordinates'][0] + ',' + tweetJson['coordinates'][1] + '&key=AIzaSyARRU-El139sH4_4DjiZIpCO4Z6qhCSTqw"></iframe></div><br>';
		else
			tweethtml += 'This tweet was not geotagged';
	}
			
	
		
	returnelement = $(tweethtml).appendTo(element);
	
	
	return returnelement;
		
}

// A function that takes a list of location and labels in json and an DOM element, and appends
// a map to the element, with the location of each geotagged tweet marked on the map.
// Markers have labels if the tweet attached to them when they are hovered over
function appendLocation(element, markerJson) {
	
	var randomnumber = Math.floor(Math.random() * (99999999 + 1));
	
	locationhtml = '<hr><h1>Location of Tweets</h1><div class="white_container"><div class="map_wrapper"><div class="search-map-canvas" id="map_' + randomnumber + '"></div></div></div>';
	
	var mapreturn;
	
	$(locationhtml).appendTo(element);
	
	function initialize() {
		var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
		var bounds = new google.maps.LatLngBounds();
		var mapOptions = {
			zoom: 4,
			scrollwheel: false,
			center: myLatlng
		}
		var map = new google.maps.Map(document.getElementById('map_' + randomnumber), mapOptions);
		mapreturn = map;
		for (i=0;i<markerJson.length;i++) {
			
			var markerLatlng = new google.maps.LatLng(markerJson[i]["lat"],markerJson[i]["long"]);
			
			var marker = new google.maps.Marker({
				position: markerLatlng,
				map: map,
				title: markerJson[i]["label"]
			});
				
			attachLabel(marker, markerJson[i]["label"]);
			
			bounds.extend(marker.position);
		}
		
		map.fitBounds(bounds);
		
		var listener = google.maps.event.addListener(map, "idle", function () {
		    map.setZoom(map.getZoom() - 2);
		    google.maps.event.removeListener(listener);
		});
	
	}
	
	function attachLabel(marker, message) {
		var infowindow = new google.maps.InfoWindow({
			content: message
		});
	
		var keepopen = false;
	
		google.maps.event.addListener(marker, 'click', function() {
			keepopen = !keepopen;
			infowindow.open(marker.get('map'), marker);
		});
	
		google.maps.event.addListener(marker, 'mouseover', function() {
			infowindow.open(marker.get('map'), marker);
		});
		
		google.maps.event.addListener(marker, 'mouseout', function() {
			if (!keepopen)
				infowindow.open();
		});
	}
	
	if (window.loaded){
		initialize();
	}	
	else {
		google.maps.event.addDomListener(window, 'load', initialize);
	}
		
	
	return mapreturn;
	
}

// Adds a new marker to a map object
function addMarkerToMap(map, latitude, longitude, label, newBounds) {
	var markerLatlng = new google.maps.LatLng(latitude, longitude);
	
	var marker = new google.maps.Marker({
		position: markerLatlng,
		map: map,
		title: label
	});
		
	var bounds;
	
	if (newBounds) {
		bounds = new google.maps.LatLngBounds();
		
		bounds.extend(marker.position);
	
		map.fitBounds(bounds);
		
		var listener = google.maps.event.addListener(map, "idle", function () {
		    map.setZoom(map.getZoom() - 4);
		    google.maps.event.removeListener(listener);
		});
	}

	
	attachLabel(marker, label);
	
	
	
	//var listener = google.maps.event.addListener(map, "idle", function () {
	//    map.setZoom(map.getZoom() - 2);
	//    google.maps.event.removeListener(listener);
	//});
		
	function attachLabel(marker, message) {
		var infowindow = new google.maps.InfoWindow({
			content: message
		});
	
		google.maps.event.addListener(marker, 'mouseover', function() {
			infowindow.open(marker.get('map'), marker);
		});
		
		google.maps.event.addListener(marker, 'mouseout', function() {
			infowindow.open();
		});
	}
}

// Adds the information to the user page before it is dispalyed based on the user's json
// Returns the created object
function setupUserPage(userJson) {
		
	//userJson = userJson['user'];	
	
	var userhtml = '<div class="center_wrapper"><h1><a href="javascript:void(0)" onclick="toggleAlternatePanel(false)">Back</a> - <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a> \'s profile</h1><hr><table class="tweet_table"><tr><td width="300px"><div class="profile_top clearfix"><img class="profile_image" src="' + userJson['profile_image_url'].replace("_normal", "") + '" alt="' + userJson['name'] + '" height="100" width="100"><div class="name_wrapper"><a href="http://www.twitter.com/' + userJson['screen_name'] + '" class="screen_name">' + userJson['name'] + '</a><br><a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><br><br></div></div></td><td>';
	  				
	  			
	if (userJson['location'] !== undefined && userJson['location'] != null)
	  userhtml +='<span class="dark">Location</span> ' + userJson['location'] + '<br>';
	  
	if (userJson['url'] !== undefined && userJson['url'] != null)
	  userhtml +='<span class="dark">Website</span> <a href="' + userJson['url'] + '">' + userJson['url'] + '</a><br>';
	
	userhtml +='<span class="dark">Joined</span> ' + removeTimezone(userJson['created_at']) + '<br><br>';
	
	if (userJson['description'] !== undefined && userJson['description'] != null)
	  userhtml +='<span class="dark">' + userJson['description'] + '</span><br><br>';				
	
	userhtml += '</td></tr></table><div id="user_tweet_location_return"></div><hr><h1>Tweets</h1>Below are the last 100 tweets for <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><div id="user_tweet_return"></div></div>';
	
	$("#alternate_panel_container").html(userhtml);
}

// Appends an alement with a table of a set of users most used words in their tweets when given the json for it
function mostUsedWordsTable(element, tableJson) {
	
	var tablehtml = '<table class="tweet_results_table" cellspacing="0"><tr><td></td>';
	
	for (i=0;i<tableJson['users'].length;i++)
		tablehtml += '<td><a href="http://www.twitter.com/' + tableJson['users'][i]['username'] + '">@' + tableJson['users'][i]['username'] + '</a><br><a href="javascript:void(0)" onclick="getUserAndTweets(\'' + tableJson['users'][i]['username'] + '\')">View user\'s profile and Tweets</a></td>';
	
	tablehtml += '<td>Total</td></tr>';
	
	for (i=0;i<tableJson['words'].length;i++) {
		
		tablehtml += '<tr><td>' + tableJson['words'][i]['word'] + '</td>';
		
		var total = 0;
		
		for (j=0;j<tableJson['words'][i]['occurences'].length;j++) {
			total += tableJson['words'][i]['occurences'][j];
			tablehtml += '<td>' + tableJson['words'][i]['occurences'][j] + '</td>';
		}
			
		tablehtml += '<td>' + total + '</td></tr>';
		
	}

	tablehtml += '</table>';
	
	element.append(tablehtml);
	
	return tablehtml;

}

// Appends an element with a table of a users most visited venues from json
function visitedVenues(element, tableJson) {
	
	var tablehtml = '<table class="tweet_results_table" cellspacing="0"><tr><td>Venue</td><td>Lat/Long</td><td>Number of visits</td><td>Latest visit date</td></tr>';

	for (i=0;i<tableJson.length;i++) {
		row = tableJson[i];
		
		console.log(row['date']);
		console.log(new Date(row['date']));
		
		tablehtml += '<tr><td>' + row['venue'] + '<br><a href="javascript:getDatabaseUserAtVenue(\'53.3816232,-1.4817597\')">View database users that visited this venue</a></td></td><td>' + row['lat'] + ', ' + row['long'] + '</td><td>' + row['visits'] + '</td><td>' + (new Date(row['date'])) + '</td></tr>';
	}
	
	tablehtml += '</table>';
	
	element.append(tablehtml);
	
	return tablehtml;

}

// Appends an element with a table of number of visits of particular users at a venue from json
function mostVisitedVenues(element, tableJson) {
	
	var tablehtml = '<table class="tweet_results_table" cellspacing="0"><tr><td>Username</td><td>Number of visits</td><td>Latest visit date</td></tr>';
	
	for (i=0;i<tableJson.length;i++) {
		row = tableJson[i];
		tablehtml += '<tr><td><a href="http://www.twitter.com/' + row['user'] + '">@' + row['user'] + '</a><br><a href="javascript:void(0)" onclick="getUserAndTweets(\'' + row['user'] + '\')">View profile and Tweets</a></td><td>' + row['visits'] + '</td><td>' + (new Date(row['date'])) + '</td></tr>';
	}
	
	tablehtml += '</table>';
	
	element.append(tablehtml);
	
	return tablehtml;

}

// Appends an element with a table of users in the database
function databaseUserTable(element, tableJson) {
	
	var tablehtml = '<div class="white_container"><table class="db_table"><thead><tr><th>Twitter ID</th><th>Screen Name</th><th>Name</th><th>Twitter</th><th>View saved details</th><th>Get live tweets</th></tr></thead><tbody>';
	
	for (i=0;i<tableJson.length;i++) {
		row = tableJson[i];
		tablehtml += '<tr><td>' + row['user_id'] + '</td><td>' + row['user'] + '</td><td>' + row['name'] + '</td><td><a href="http://twitter.com/' + row['user'] + '">Twitter</a></td><td><a href="javascript:getDatabaseUserAndTweets(1)">View saved details</a></td><td><a href="javascript:getUserAndTweets(\'' + row['user'] + '\')">Get live tweets</a></td></tr>';
	}
	
	tablehtml += '</tbody></table></div>';
	
	element.append(tablehtml);
	
	return tablehtml;

}

// Gets a user and their tweets
function setupUserDatabasePage(userJson) {
		
	//userJson = userJson['user'];	
	
	var userhtml = '<div class="center_wrapper"><h1><a href="javascript:void(0)" onclick="toggleAlternatePanel(false)">Back</a> - <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a> \'s details from database</h1><hr><table class="tweet_table"><tr><td width="300px"><div class="profile_top clearfix"><img class="profile_image" src="' + userJson['profile_image_url'].replace("_normal", "") + '" alt="' + userJson['name'] + '" height="100" width="100"><div class="name_wrapper"><a href="http://www.twitter.com/' + userJson['screen_name'] + '" class="screen_name">' + userJson['name'] + '</a><br><a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><br><br></div></div></td><td>';
	  				
	  			
	if (userJson['location'] !== undefined && userJson['location'] != null)
	  userhtml +='<span class="dark">Location</span> ' + userJson['location'] + '<br>';
	  
	if (userJson['url'] !== undefined && userJson['url'] != null)
	  userhtml +='<span class="dark">Website</span> <a href="' + userJson['url'] + '">' + userJson['url'] + '</a><br>';
	
	userhtml +='<span class="dark">Joined</span> ' + removeTimezone(userJson['created_at']) + '<br><br>';
	
	if (userJson['description'] !== undefined && userJson['description'] != null)
	  userhtml +='<span class="dark">' + userJson['description'] + '</span><br><br>';				
	
	userhtml += '</td></tr></table><div id="user_database_tweet_location_return"></div><hr><h1>Tweets</h1>Below are the last 100 tweets for <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><div id="user_database_tweet_return"></div></div>';
	
	$("#alternate_panel_container").html(userhtml);
}

// Appends an element with a table of venues in the database
function databaseVenueTable(element, tableJson) {
	
	var tablehtml = '<div class="white_container"><table class="db_table"><thead><tr><th>Venue name</th><th>Coordinates</th><th>Number of visitors</th><th>View users that have visited</th></tr></thead><tbody>';
	
	for (i=0;i<tableJson.length;i++) {
		row = tableJson[i];
		tablehtml += '<tr><td>' + row['venue'] + '</td><td>' + row['coordinates'] + '</td><td>' + row['visitors'] + '</td><td><a href="javascript:getDatabaseUserAtVenue(\'' + row['coordinates'] + '\')">Users</a></td></tr>';
	}
	
	tablehtml += '</tbody></table></div>';
	
	element.append(tablehtml);
	
	return tablehtml;

}

// Appends an element with a table of users that visited a venue in the database
function setupVenueUsersDatabasePage(data) {
	
	var tablehtml = '<div class="center_wrapper"><h1><a href="javascript:void(0)" onclick="toggleAlternatePanel(false)">Back</a> - Users that have visited ' + data.location_name + '</h1><hr>';
	
	tablehtml += '<div class="white_container"><table class="db_table"><thead><tr><th>Twitter ID</th><th>Screen Name</th><th>Name</th><th>Twitter</th><th>View saved details</th><th>Get live tweets</th></tr></thead><tbody>';
	
	for (i=0;i<data.databaseusertable.length;i++) {
		row = data.databaseusertable[i];
		tablehtml += '<tr><td>' + row['user_id'] + '</td><td>' + row['user'] + '</td><td>' + row['name'] + '</td><td><a href="http://twitter.com/' + row['user'] + '">Twitter</a></td><td><a href="javascript:getDatabaseUserAndTweets(1)">View saved details</a></td><td><a href="javascript:getUserAndTweets(\'' + row['user'] + '\')">Get live tweets</a></td></tr>';
	}
	
	tablehtml += '</tbody></table></div>';
	
	$("#alternate_panel_container").html(tablehtml);

}
