var mysql      = require('mysql');
var prettyjson = require('prettyjson');
var Twit = require('twit');
var dateFormat = require('dateformat');
var connection = mysql.createConnection({
  host     : 'jamesmcilveen.com',
  user     : 'iw',
  password : 'web123',
  database : 'intelligent_web'
});

twitterRestAPI = new Twit({
  consumer_key: 'NlT41DmogCgb5C6PsgogvHy29',
  consumer_secret: '4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905',
  access_token: "351930928-yxyRBBj5UOOKXVBGNrVXs562E77PkWgPglqP0yma",
  access_token_secret: "hqDIZPei3XVXliXGCMiSqkW4pCaLrgI1pzxr9PVidPVLh"	
});

//test functions

searchParams = { screen_name : "jtmcilveen"};
//searchParams = { screen_name : "KillerMillerGB"};
//twitterRestAPI.get('users/lookup', searchParams, function(err, data, response) {
twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
	if(!err){

		userTweets("KillerMillerGB");
		//addVenue(data[0]);
		//addTweet(data[2]);
		//addUser(data[0]);
		//console.log(data[0]);
	}
	else{
		console.log(err);
	}

});


var addUser = exports.addUser = function(userParms){
	var sql = "INSERT IGNORE INTO `twitter_users` (`twitterID`, `screenName`, `name`, `location`, `website`, `joined`, `description`, `image_url`, `user_url`) VALUES ("+userParms.id+",'" + userParms.screen_name+"' , '"+userParms.name+"', '"+userParms.location+"', '"+userParms.url+"', '"+userParms.created_at+"', '"+userParms.description+"', '"+userParms.profile_image_url+"', 'https://twitter.com/"+userParms.screen_name+ "')";
	connection.query(sql,function(err, result){
		if(!err)
			console.log(result);
		else
			console.log(err);
	

	});


};

var addTweet = exports.addTweet = function(tweet){
	
	var sql = "INSERT INTO `tweets` (`tweetId`, `tweetText`, `tweetDate`, `screenID`) VALUES ("+tweet.id+",'" + tweet.text+"' , '"+tweet.created_at+"','"+tweet.user.id+"')";
	console.log(sql);
		connection.query(sql,function(err, result){
		if(!err){
			if(tweet.place)
				addVenue(tweet);

			else
			console.log(err);
		}
		else
		{
			console.log(err);
		}

	});
};

var addVenue = exports.addVenue = function(tweet){
	

	var lat;
	var long;
	var fullname;
	var name = tweet.place.name.toLowerCase();

	if(tweet.coordinates){
		 lat = tweet.coordinates.coordinates[1];
         long = tweet.coordinates.coordinates[0];
}
	var sql = "INSERT INTO `venues` (`name`,`lat`, `long`, `tweet_fk_id`) VALUES ('"+name+"',"+lat+","+long+",'"+tweet.id+"')";
	connection.query(sql,function(err, result){
		if(!err)
			console.log(result);
		else
		console.log(err);
	});
	
};


//EXPAND FOR FOURSQAURE AND TWITTER
var userSearch = exports.userSearch = function(user){
	//var sql = 'SELECT * FROM `tweets` INNER JOIN twitter_users ON tweets.screenID and twitter_users.screenName ="'+user+'"';	
	var sql = 'SELECT * FROM `twitter_users` WHERE screenName ="'+user+'"';	
	console.log(sql);
	connection.query(sql, function(err, rows, fields){
		if(!err){
			console.log(rows);
			userTweets(rows[0].twitterID)
}
		else
			console.log(err);

	});
};



var userTweets = exports.userSearch = function(user){
	var sql = 'SELECT * FROM `twitter_users` INNER JOIN  tweets.screenID ON twitter_users and twitter_users.screenName ="'+user+'"';	
	//var sql = 'SELECT * FROM `tweets` WHERE screenID ="'+userID+'"';	
	console.log(sql);
	connection.query(sql, function(err, rows, fields){
		if(!err)
			console.log(rows);
		else
			console.log(err);

	});
};



var addFourSqaureUser = exports.addUser = function(userParms){
	var gender = 0;
	if(userParms == 'femail')
		gender = 1;
	var photoURL = userParms.photo.prefix + userParms.photo.suffix.substring(1);
	var sql = "INSERT IGNORE INTO `twitter_users` (`foursqaure_id`, `twitter_user_fk_id`, `firstName`, `lastName`, `female`, `photoURL`) VALUES ("+userParms.id+",'" + userParms.firstName+"' , '"+userParms.lastName+"', '"+gender+"', '"+photoURL+"')";
	connection.query(sql,function(err, result){
		if(!err)
			console.log(result);
		else
			console.log(err);
	

	});

};
var addVenue = exports.addFourSquareVenue = function(checkin){
	var venue = checkin.venue;
	var sql = "INSERT INTO `venues` (`checkinID`,`venue_id`,`name`,`lat`, `long`, `user_id_fk`, `datetime`) VALUES ('"+venue.id+"',"+venue.name+","+venue.lat+",'"+venue.lng+"','"checkin.id+"')";
	connection.query(sql,function(err, result){
		if(!err)
			console.log(result);
		else
		console.log(err);
	});
	
};