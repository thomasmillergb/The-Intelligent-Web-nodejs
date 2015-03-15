
var haveTwitterAPITokens = false;
var haveFourAPITokens = false;

// Changes the active tab
function activeTab(id) {
	$("#tab_container > div").css("display", "none");
	$('#' + id).css("display", "block");
	$("html, body").animate({ scrollTop: 0 }, 300);
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



// Not a clue what this does or what it is for
function getTwitAuth(token, token_secret){

	var twitter_token = token;
	var twitter_token_secret = token_secret;

	var twitTokens = {token: twitter_token ,token_secret:twitter_token_secret};

	$.ajax({
        type: "POST",
        dataType: 'json',
        url: "http://127.0.0.1:3000/",
        data: twitTokens,
        success: function(){    
            location.reload();   
        }
     });
	

	

	twitter_token = token;
	twitter_token_secret = token_secret;

}


// Gets a user and their tweets
function getUserAndTweets(username) {
	
	// TODO: Get tweets from AJAX and and them into the form before it opens
	
	setupUserPage(exampleUserJson);
	for (i = 0; i < 10; i++)
		appendTweetWithoutAccount($("#user_tweet_return"), exampleTweetJson);
	
	toggleUserShow();
}

// Toggles whether the client is focused on the user panel
function toggleUserShow() {
	$("#tab_container, #user_container").toggleClass("hide");
	$("html, body").animate({ scrollTop: 0 }, 300);
}

// Callback function for Twitter child window
function setTwitterAuth(token, token_secret) {
	localStorage.setItem('twitter_token', token);
	localStorage.setItem('twitter_token_secret', token_secret);
	
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
	
	if (localStorage.getItem("twitter_token") !== null && localStorage.getItem("twitter_token_secret") !== null)
		haveTwitterAPITokens = true;
	else
		haveTwitterAPITokens = false;
	
	if (localStorage.getItem("four_token") !== null)
		haveFourAPITokens = true;
	else
		haveFourAPITokens = false;
	
	setRestrictions();
	
});


// Applies restrictions to forms so that they can not be used if the user has not obtained API tokens
function setRestrictions() {
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

}

// Toggle functon for the loading overlay
function loadingOverlay(loading) {
	if (loading)
		$("body").addClass("loading");
	else
		$("body").removeClass("loading");
}

// Intercepts form submits and cancels default action
$(function(){
	$("form").submit(function(e){
		
		loadingOverlay(true);
		
		e.preventDefault();
	    return false;
	});
});

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
function appendTweetWithAccount(element, json) {
	
		tweetJson = JSON.parse(json);
		
		var tweethtml ='<table class="tweet_table" id="' + tweetJson['id_str'] + '"><tr><td width="300px"><div class="profile_top clearfix"><img class="profile_image" src="' + tweetJson['user']['profile_image_url'] + '" alt="' + tweetJson['user']['screen_name'] + '" height="100" width="100"><div class="name_wrapper"><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '" class="screen_name">' + tweetJson['user']['name'] + '</a><br><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a><br><br></div></div>';
					
					
					
		if (tweetJson['user']['location'] !== undefined)
			tweethtml +='<span class="dark">Location</span> ' + tweetJson['user']['location'] + '<br>';
			
		if (tweetJson['user']['url'] !== undefined)
			tweethtml +='<span class="dark">Website</span> <a href="' + tweetJson['user']['url'] + '">' + tweetJson['user']['url'] + '</a><br>';
		
		tweethtml +='<span class="dark">Joined</span> ' + removeTimezone(tweetJson['user']['created_at']) + '<br><br>';
		
		if (tweetJson['user']['description'] !== undefined)
			tweethtml +='<span class="dark">' + tweetJson['user']['description'] + '</span><br><br>';
			
			
		tweethtml +='<a href="javascript:void(0)" onclick="getUserAndTweets(\'' + tweetJson['user']['id_str'] + '\')">View user\'s profile and Tweets</a></td><td><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a> ' + removeTimezone(tweetJson['created_at']) + '<br><div class="tweet">' + tweetJson['text'] + '</div>' + tweetJson['favourites_count'] + ' Favourites, ' + tweetJson['retweet_count'] + ' Re-Tweets<br><br>';

		if (tweetJson['geo'] !== undefined && tweetJson['geo']['coordinates'] !== undefined)
			tweethtml +='<div class="map_wrapper"><iframe width="100%" height="150" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=' + tweetJson['coordinates'][0] + ',' + tweetJson['coordinates'][1] + '&key=AIzaSyARRU-El139sH4_4DjiZIpCO4Z6qhCSTqw"></iframe></div>';
		else
			tweethtml += 'This tweet was not geotagged';
		
		tweethtml +='<br><br><div class="tweet_replies_wrapper"><center><a href="javascript:void(0)">See replies to tweet</a></center></div></td></tr></table><hr>';
		
	return $(tweethtml).prependTo(element);
}

// Appends a tweet to an element from the tweets json without their account
// Returns the created element
function appendTweetWithoutAccount(element, json) {
	
	tweetJson = JSON.parse(json);
	
	var tweethtml = '<div class="white_container"><a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a> ' + removeTimezone(tweetJson['created_at']) + '<br><div class="tweet">' + tweetJson['text'] + '</div>' + tweetJson['favourites_count'] + ' Favourites, ' + tweetJson['retweet_count'] + ' Re-Tweets<br><br>';
		
	if (tweetJson['geo'] !== undefined && tweetJson['geo']['coordinates'] !== undefined)
		tweethtml +='<div class="map_wrapper"><iframe width="100%" height="150" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=' + tweetJson['coordinates'][0] + ',' + tweetJson['coordinates'][1] + '&key=AIzaSyARRU-El139sH4_4DjiZIpCO4Z6qhCSTqw"></iframe></div>';
	else
		tweethtml += 'This tweet was not geotagged';	
			
	tweethtml += '<br><br><div class="tweet_replies_wrapper"><center><a href="javascript:void(0)">See replies to tweet</a></center></div>';
		
		
	return $(tweethtml).prependTo(element);
}

// Prepends a reply tweet to an element from the tweets json
// Returns the created element
function appendTweetReplies(element, json) {							
										
	tweetJson = JSON.parse(json);
	
	var tweethtml = '';
	
	tweethtml = '<a href="http://www.twitter.com/' + tweetJson['user']['screen_name'] + '">@' + tweetJson['user']['screen_name'] + '</a> ' + removeTimezone(tweetJson['created_at']) + ' - <a href="javascript:void(0)" onclick="getUserAndTweets(\'' + tweetJson['user']['id_str'] + '\')">View user\'s profile and Tweets</a><br><div class="tweet">' + tweetJson['text'] + '</div>';
		
		
	return $(tweethtml).appendTo(element);								
}


// Adds the information to the user page before it is dispalyed based on the user's json
// Returns the created object
function setupUserPage(json) {
	
	userJson = JSON.parse(json);
		
	//userJson = userJson['user'];	
	
	var userhtml = '<div class="center_wrapper"><h1><a href="javascript:void(0)" onclick="toggleUserShow()">Back</a> - <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a> \'s profile</h1><hr><table class="tweet_table"><tr><td width="300px"><div class="profile_top clearfix"><img class="profile_image" src="' + userJson['profile_image_url'].replace("_normal", "") + '" alt="' + userJson['name'] + '" height="100" width="100"><div class="name_wrapper"><a href="http://www.twitter.com/' + userJson['screen_name'] + '" class="screen_name">' + userJson['name'] + '</a><br><a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><br><br></div></div></td><td>';
	  				
	  			
	if (userJson['location'] !== undefined)
	  userhtml +='<span class="dark">Location</span> ' + userJson['location'] + '<br>';
	  
	if (userJson['url'] !== undefined)
	  userhtml +='<span class="dark">Website</span> <a href="' + userJson['url'] + '">' + userJson['url'] + '</a><br>';
	
	userhtml +='<span class="dark">Joined</span> ' + removeTimezone(userJson['created_at']) + '<br><br>';
	
	if (userJson['description'] !== undefined)
	  userhtml +='<span class="dark">' + userJson['description'] + '</span><br><br>';				
	
	userhtml += '</td></tr></table><hr><h1>Tweets</h1>Below are the last 100 tweets for <a href="http://www.twitter.com/' + userJson['screen_name'] + '">@' + userJson['screen_name'] + '</a><div id="user_tweet_return"></div></div>';
	
	$("#user_container").html(userhtml);
}

