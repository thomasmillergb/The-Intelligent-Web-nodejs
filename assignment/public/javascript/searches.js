// Test data
var exampleUserJson = '{"id":308358479,"id_str":"308358479","name":"James McIlveen","screen_name":"jtmcilveen","location":"Whaley Bridge","profile_location":null,"description":"Rock climber (bouldering) and computer scientist doing my Masters at Sheffield University","url":"http://t.co/BiYvW71Wux","entities":{"url":{"urls":[{"url":"http://t.co/BiYvW71Wux","expanded_url":"http://www.jamesmcilveen.com","display_url":"jamesmcilveen.com","indices":[0,22]}]},"description":{"urls":[]}},"protected":true,"followers_count":58,"friends_count":31,"listed_count":0,"created_at":"Tue May 31 08:22:02 +0000 2011","favourites_count":9,"utc_offset":0,"time_zone":"London","geo_enabled":false,"verified":false,"statuses_count":53,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/490139247945719809/GHt2iObY_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/490139247945719809/GHt2iObY_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/308358479/1405693222","profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"default_profile":true,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false,"suspended":false,"needs_phone_verification":false}';

var exampleTweetJson_1 = '{"coordinates":[53.381796,-1.480719],"favorited":false,"truncated":false,"created_at":"Mon Sep 24 03:35:21 +0000 2012","id_str":"250075927172759552","entities":{"urls":[],"hashtags":[{"text":"example","indices":[20,34]}],"user_mentions":[]},"in_reply_to_user_id_str":null,"contributors":null,"text":"This is an #example tweet 1111111111","metadata":{"iso_language_code":"en","result_type":"recent"},"retweet_count":0,"in_reply_to_status_id_str":null,"id":250075927172759552,"geo":{"type":"point","coordinates":[53.381796,-1.480719]},"retweeted":false,"in_reply_to_user_id":null,"place":null,"user":' + exampleUserJson + ',"in_reply_to_screen_name":null,"source":"<a>Twitter for Mac</a>","in_reply_to_status_id":null}';

var exampleTweetJson_2 = '{"coordinates":[53.3816232,-1.4817597],"favorited":false,"truncated":false,"created_at":"Mon Sep 24 03:35:21 +0000 2012","id_str":"250075927172759552","entities":{"urls":[],"hashtags":[{"text":"example","indices":[20,34]}],"user_mentions":[]},"in_reply_to_user_id_str":null,"contributors":null,"text":"This is an #example tweet 2222222222","metadata":{"iso_language_code":"en","result_type":"recent"},"retweet_count":0,"in_reply_to_status_id_str":null,"id":250075927172759552,"geo":{"type":"point","coordinates":[53.3816232,-1.4817597]},"retweeted":false,"in_reply_to_user_id":null,"place":null,"user":' + exampleUserJson + ',"in_reply_to_screen_name":null,"source":"<a>Twitter for Mac</a>","in_reply_to_status_id":null}';

var collectionOfTweets = '[' + exampleTweetJson_1 + ',' + exampleTweetJson_2 + ']';

// Discussion search
$(function(){
	$("#discussion_search_form").submit(function(e){
		
		
		/////////////////////////////////
		// Discussion search imitation //
		/////////////////////////////////
		
		loadingOverlay(true);
		
		$("#discussion_tweet_return").html("");
		
		setTimeout(function() {
			// Adds a tweet dynamically to the page by passing its json
			appendLocationOfTweets($("#discussion_tweet_return"), collectionOfTweets);
			
			$("#discussion_tweet_return").append("<hr><h1>Tweets</h1>");
			var newtweet = appendTweetWithAccount($("#discussion_tweet_return"), exampleTweetJson_1);
			appendTweetWithAccount($("#discussion_tweet_return"), exampleTweetJson_2);
			
			loadingOverlay(false);
			
			scrollToElement($("#discussion_tweet_return"));
			
			addNotification("Discussion search", "Search successfull. Scroll down for results.", 5000);
		}, 1000);
		
		
		e.preventDefault();
	    return false;
	});
});

// User discussion search
$(function(){
	$("#user_discussion_search_form").submit(function(e){
		
		
		//////////////////////////////////////
		// User discussion search imitation //
		//////////////////////////////////////
		
		loadingOverlay(true);
		
		$("#user_discussion_table_return").html("");
		
		setTimeout(function() {
	
			
			$("#user_discussion_table_return").append("<hr><h1>Tweets</h1>");
			
			mostUsedWordsTable($("#user_discussion_table_return"), exampleTweetJson_1);
			
			loadingOverlay(false);
			
			scrollToElement($("#user_discussion_table_return"));
			
			addNotification("User discussion search", "Search successfull. Scroll down for results.", 5000);
		}, 1000);
		
		
		e.preventDefault();
	    return false;
	});
});

// User venue search
$(function(){
	$("#user_venues_search_form").submit(function(e){
		
		
		//////////////////////////////////
		// User venues search imitation //
		//////////////////////////////////
		
		loadingOverlay(true);
		
		$("#user_venues_return").html("");
		
		setTimeout(function() {
			
			$("#user_venues_return").append("<hr><h1>User venues</h1>Here are the venues for <a href=\"#\">@jtmcilveen</a><br><a href=\"javascript:void(0)\" onclick=\"getUserAndTweets('none')\">View user's profile and Tweets</a>");
			
			mostVisitedVenues($("#user_venues_return"), exampleTweetJson_1);
			
			appendLocationOfTweets($("#user_venues_return"), collectionOfTweets);
			
			loadingOverlay(false);
			
			scrollToElement($("#user_venues_return"));
			
			addNotification("User discussion search", "Search successfull. Scroll down for results.", 5000);
		}, 1000);
		
		
		e.preventDefault();
	    return false;
	});
});

// Venue search
$(function(){
	$("#venue_search_form").submit(function(e){
		
		
		////////////////////////////
		// Venue search imitation //
		////////////////////////////
		
		loadingOverlay(true);
		
		$("#venue_return").html("");
		
		setTimeout(function() {
	
			$("#venue_return").append("<hr><h1>Users at venue</h1><span>Here are the users that have been found in the search area</span>");
			
			mostVisitedVenues($("#venue_return"), exampleTweetJson_1);
			
			appendLocationOfTweets($("#venue_return"), collectionOfTweets);
			
			loadingOverlay(false);
			
			scrollToElement($("#venue_return"));
			
			addNotification("User discussion search", "Search successfull. Scroll down for results.", 5000);
		}, 1000);
		
		
		e.preventDefault();
	    return false;
	});
});

function scrollToElement(element) {
	$('html, body').animate({
        scrollTop: element.offset().top - 100
    }, 500);
}