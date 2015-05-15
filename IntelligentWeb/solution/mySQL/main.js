var mysql      = require('mysql');
var prettyjson = require('prettyjson');
var Twit = require('twit');
var dateFormat = require('dateformat');

var foursqaure = require('../foursqaure/main.js');

function createConnection(callback){
	var connection = mysql.createConnection({
	  host     : 'jamesmcilveen.com',
	  user     : 'iw',
	  password : 'web123',
	  database : 'intelligent_web'
	});
	callback(connection);
}
twitterRestAPI = new Twit({
  consumer_key: 'NlT41DmogCgb5C6PsgogvHy29',
  consumer_secret: '4e0sav0ciNSlafDjMWjQKXAQXCmxAC3vfTQv9TuB5LEiJPP905',
  access_token: "351930928-yxyRBBj5UOOKXVBGNrVXs562E77PkWgPglqP0yma",
  access_token_secret: "hqDIZPei3XVXliXGCMiSqkW4pCaLrgI1pzxr9PVidPVLh"	
});
/*
//test functions
//jtmcilveen
searchParams = { screen_name : "KillerMillerGB", count:2};
//searchParams = { screen_name : "KillerMillerGB"};
//twitterRestAPI.get('users/lookup', searchParams, function(err, data, response) {
twitterRestAPI.get('statuses/user_timeline', searchParams, function(err, data, response) {
	if(!err){
		var accesstoken = "Q45LXRJRPRK410WSWXP25AVR5HIIFQ3VND4PY55BAQ43AIYQ";
		insertTwitterData(data);
		//userTweets("KillerMillerGB");
		//addVenue(data[0]);
		//addTweet(data[2]);
		//addUser(data[0]);
		//console.log(data[0]);
		insertFourSqaureFromTwitterData(data, accesstoken);
	}
	else{
		console.log(err);
	}

});
*/
var insertTwitterData =exports.insertTwitterData = function(data, callback) {
	createConnection(function(connection){
		var addUser = "INSERT IGNORE INTO `twitter_users` (`twitterID`, `screenName`, `name`, `location`, `website`, `joined`, `description`, `image_url`, `user_url`) VALUES ";
		var addTweet = "INSERT IGNORE INTO `tweets` (`tweetId`, `tweetText`, `tweetDate`, `screenID`) VALUES ";
		var addVenue = "INSERT IGNORE INTO `venues` (`name`,`lat`, `long`, `tweet_fk_id`) VALUES ";
		var venueCount = 0;
		//console.log(data);
		//sort out if not array
		
		if(!Array.isArray(data)){
			var x = [];
			x.push(data);
			data = [];
			data = x;
		}
		//console.log(data);
		data.forEach(function(tweet, index) {
			//console.log(tweet);
			var userParms =  tweet.user;
			
			addUser +="("+userParms.id+"," + mysql.escape(userParms.screen_name)+" , "+mysql.escape(userParms.name)+", "+mysql.escape(userParms.location)+", "+mysql.escape(userParms.url)+", '"+userParms.created_at+"', "+ mysql.escape(userParms.description) +", '"+userParms.profile_image_url+"', " + mysql.escape('https://twitter.com/'+userParms.screen_name) + "),"
			addTweet += "("+tweet.id+"," + mysql.escape(tweet.text) +" , '"+tweet.created_at+"','"+tweet.user.id+"'),";
			if(tweet.currentData && tweet.coordinates.coordinates[1]){
				venueCount++;
		        var lat = currentData.coordinates.coordinates[1];
		        var long = currentData.coordinates.coordinates[0];
				addVenue += "("+mysql.escape(tweet.place.name)+","+lat+","+long+","+tweet.id+"),"
			}
			else if(tweet.place){
				venueCount++;
				addVenue += "("+mysql.escape(tweet.place.name)+","+0.0+","+0.0+","+tweet.id+"),"
			}
		});
		//console.log(addUser);
		connection.query(addUser.substring(0, addUser.length - 1),function(err, result){
			if(err)console.log(err);
			connection.query(addTweet.substring(0, addTweet.length - 1),function(err, result){
				if(err)console.log(err);
				if(venueCount !=0){
					connection.query(addVenue.substring(0, addVenue.length - 1),function(err, result){
						if(err)console.log(err);
						connection.end();
						callback();
					});
				}else{
					connection.end();
					callback();
				}
			});
		});
	});
}
var insertFourSqaureFromTwitterData =exports.insertFourSqaureFromTwitterData = function(data, access_token) {

	foursqaure.getVenues(data,access_token, function(checkIns) {
		//console.log(checkIns);
		insertFourSqaureData(checkIns);
	});
}
var insertFourSqaureData =exports.insertFourSqaureData = function(checkInsAndID) {


	createConnection(function(connection){

		var addVenue = "INSERT IGNORE INTO `foursqaure_venue` (`checkinID`,`venue_id`,`name`,`lat`, `long`, `user_id_fk`, `datetime`, `tweet_id_fk`, `description`, `rating`, `likes`, `address`, `photo`, `url` ) VALUES ";
		var addUser = "INSERT IGNORE INTO `foursqaure_users` (`foursqaure_id`, `twitter_user_fk_id`, `firstName`, `lastName`, `female`, `photoURL`) VALUES ";

		if(checkInsAndID != null && checkInsAndID != [] && checkInsAndID.length > 0){
			checkInsAndID.forEach(function(checkinAndID, idx) {
				var checkin = checkinAndID.checkin
				/*
				console.log("tweetid: "+checkinAndID.tweetID);
				console.log("tweetid: "+checkinAndID.twitterID);
*/
				//console.log(checkin);
				
				var userParms = checkin.user;
				var gender = 0;
				if(userParms == 'femail')
					gender = 1;
				var photoURL = userParms.photo.prefix + userParms.photo.suffix.substring(1);

				addUser += "("+userParms.id+"," +checkinAndID.twitterID+"," + mysql.escape(userParms.firstName)+" , "+mysql.escape(userParms.lastName)+", '"+gender+"', '"+photoURL+"'),";

				var venue = checkin.venue;
				var marker = {};
				if(checkin.venue.location.lat!= null || checkin.venue.location.lng!= null ){
					marker.lat = Math.floor(checkin.venue.location.lat * Math.pow(10,8)) / Math.pow(10,8);
				    marker.long = Math.floor(checkin.venue.location.lng * Math.pow(10,8)) / Math.pow(10,8);
				}
				else{
					marker.lat = 0;
				    marker.long = 0;
				}
			        // detaled veune
			    if(checkin.venue.rating != null){
			        marker.rating = checkin.venue.rating;
			    }
			    else{
			        marker.rating = "Not yet rated";
			    }
			    if(checkin.venue.location.formattedAddress != null)
			        marker.formattedAddress = checkin.venue.location.formattedAddress
			    else
			        marker.formattedAddress = "No address found"

			    if(checkin.venue.description != null){
			        marker.description = checkin.venue.description;

			    }
			    else{
			        marker.description = "No description for venue";

			    }
			    marker.bestPhoto= {};
			    if(checkin.venue.bestPhoto ==null){

			        if(checkin.venue.categories.length == 0 || checkin.venue.categories == null){
			            marker.bestPhoto.prefix = " ";
			            marker.bestPhoto.suffix = " ";
			            marker.bestPhoto = " ";  
			        }
			        else{
			            marker.bestPhoto.prefix = checkin.venue.categories[0].icon.prefix;
			            marker.bestPhoto.suffix = checkin.venue.categories[0].icon.suffix;
			            marker.bestPhoto.url = checkin.venue.bestPhoto.prefix + "64" + checkin.venue.bestPhoto.suffix;  
			        }
			    }
			    else{
			        //console.log(checkin.venue.bestPhoto);
			        marker.bestPhoto.prefix = checkin.venue.bestPhoto.prefix;
			        marker.bestPhoto.suffix = checkin.venue.bestPhoto.suffix;
			        marker.bestPhoto.height = checkin.venue.bestPhoto.height;
			        marker.bestPhoto.width = checkin.venue.bestPhoto.width;
			        marker.bestPhoto = checkin.venue.bestPhoto.prefix + marker.bestPhoto.width+"x"+ marker.bestPhoto.height + checkin.venue.bestPhoto.suffix;
			    } 
			    console.log(mysql.escape(marker.formattedAddress));
				addVenue += "("+ mysql.escape(checkin.id) +","+mysql.escape(venue.id)+","+mysql.escape(venue.name)+","+marker.lat+","+marker.long+","+mysql.escape(checkin.user.id)+","+ checkin.createdAt +","+checkinAndID.tweetID+","+mysql.escape(marker.description)+","+mysql.escape(marker.rating)+","+mysql.escape(venue.likes.count)+",'"+marker.formattedAddress+"',"+  mysql.escape(marker.bestPhoto)+ ","+  mysql.escape(venue.shortUrl) +"),";

			});
			//console.log(addUser);
			console.log(addVenue);

				connection.query(addUser.substring(0, addUser.length - 1),function(err, result){
					if(err)console.log(err);
					//console.log(addVenue);
					connection.query(addVenue.substring(0, addVenue.length - 1),function(err, result){
						if(err)console.log(err);
						connection.end();
					});


				});


		}
	});

}

var addUser = exports.addUser = function(tweet, callback){
	var userParms =  tweet.user
	     //connection.query('INSERT INTO `lastPosition` SET ? ON DUPLICATE KEY UPDATE Lat=VALUES(Lat), Lon=VALUES(Lon), Time=VALUES(Time)', result);
	var sql = "INSERT IGNORE INTO `twitter_users` (`twitterID`, `screenName`, `name`, `location`, `website`, `joined`, `description`, `image_url`, `user_url`) VALUES ("+userParms.id+",'" + userParms.screen_name+"' , '"+userParms.name+"', '"+userParms.location+"', '"+userParms.url+"', '"+userParms.created_at+"', '"+userParms.description+"', '"+userParms.profile_image_url+"', 'https://twitter.com/"+userParms.screen_name+ "')"+
	" ON DUPLICATE KEY UPDATE `screenName`=('"+ userParms.screen_name+"')"
	//"ON DUPLICATE KEY UPDATE `screenName`=('"+ userParms.screen_name+"') `name`=('"+ userParms.name+"') `location`=('"+ userParms.location+"') `website`('"+ userParms.url+"')  `description`=('"+ userParms.description+"') image_url('"+ userParms.profile_image_url+"') user_url('https://twitter.com/"+userParms.screen_name+ "') ";
																										
	connection.query(sql,function(err, result){
		if(!err){
			addTweet(tweet);
			console.log("add user: "+result);
		}
		else{
			addTweet(tweet);
			console.log("add user err: "+err);
			}	
			callback();
		

	});


};

var addTweet = exports.addTweet = function(tweet, callback){
	//(97382675626729470,'#neverinamillionyears would I ever voluntarily put sots in my eyes.. It just sounds painful, and I cant see the allure of getting drunk :\' , 'Sat Jul 30 19:06:53 +0000 2011','308358479')
	var sql = "INSERT INTO `tweets` (`tweetId`, `tweetText`, `tweetDate`, `screenID`) VALUES ("+tweet.id+",'" + tweet.text+"' , '"+tweet.created_at+"','"+tweet.user.id+"')";
	
	//console.log(sql);
		connection.query(sql,function(err, result){
		if(!err){
			/*
			if(tweet.place)
				addVenue(tweet);

			else
				*/
			console.log("add tweet:" +result);
		}
		else
		{
			console.log("add tweet err:" +err);
		}
		callback();

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









var addFourSqaureUser = exports.addFourSqaureUser = function(userParms){
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
var addFourSquareVenue = exports.addFourSquareVenue = function(checkin){
	var venue = checkin.venue;
	var sql = "INSERT INTO `venues` (`checkinID`,`venue_id`,`name`,`lat`, `long`, `user_id_fk`, `datetime`) VALUES ('"+venue.id+"',"+venue.name+","+venue.lat+",'"+venue.lng+"','"+checkin.id+"')";
	connection.query(sql,function(err, result){
		if(!err)
			console.log(result);
		else
		console.log(err);
	});
	
};



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////mysql search//////////////////////////////////////



//EXPAND FOR FOURSQAURE AND TWITTER
var userSearch = exports.userSearch = function(user, callback){
	//var sql = 'SELECT * FROM `tweets` INNER JOIN twitter_users ON tweets.screenID and twitter_users.screenName ="'+user+'"';	
	var sql = 'SELECT * FROM `twitter_users` WHERE screenName ="'+user+'"';	
	console.log(sql);
	createConnection(function(connection){
		connection.query(sql, function(err, rows, fields){
			if(!err){
				
				callback(rows)
			}
			else
				console.log(err);
			connection.end();
		});
	});
};


var userTweetsScreenName = exports.userTweetsScreenName = function(user,callback){
	var sql = 'SELECT * FROM `twitter_users` INNER JOIN  tweets ON twitter_users.twitterID = tweets.screenID AND twitter_users.screenName ='+mysql.escape(user);	
	//var sql = 'SELECT * FROM `tweets` WHERE screenID ="'+userID+'"';	
	console.log(sql);
	createConnection(function(connection){
	connection.query(sql, function(err, rows, fields){
		if(!err)
			callback(rows);
		else
			console.log(err);
		connection.end();
	});
	});
};
var userTweetsScreenID = exports.userTweetsScreenID = function(id,callback){
	//var sql = 'SELECT * FROM `twitter_users` INNER JOIN  tweets ON twitter_users.twitterID = tweets.screenID AND twitter_users.twitterID ='+mysql.escape(id);	
	var sql = 'SELECT * FROM venues, tweets, twitter_users, foursqaure_venue WHERE twitter_users.twitterID ='+mysql.escape(id)+' AND venues.tweet_fk_id = tweets.tweetId'+' AND tweets.screenID = twitter_users.twitterID AND foursqaure_venue.tweet_id_fk = tweets.tweetId';	
	//var sql = 'SELECT * FROM `tweets` WHERE screenID ="'+userID+'"';	
	console.log(sql);
	createConnection(function(connection){
	connection.query(sql, function(err, rows, fields){
		if(!err)
			callback(rows);

		else
			console.log(err);
		connection.end();
	});
	});
};
//userSearch("killermillergb");
//userTweets(308358479);
//userTweetsScreenID("308358479");

var userFourSqaure = exports.userFourSqaure = function(user,callback){
	var sql;
	if(isNaN(user))
	   sql = 'SELECT * FROM foursqaure_users, twitter_users WHERE (foursqaure_users.firstName ='+mysql.escape(user)+ 'OR foursqaure_users.lastName ='+mysql.escape(user)+') AND  twitter_users.twitterID = foursqaure_users.twitter_user_fk_id ';	
	else
	sql = 'SELECT * FROM foursqaure_users, twitter_users WHERE foursqaure_users.foursqaure_id ='+mysql.escape(user)+' AND  twitter_users.twitterID = foursqaure_users.twitter_user_fk_id' ;	
	//var sql = 'SELECT * FROM `tweets` WHERE screenID ="'+userID+'"';	
	console.log(sql);
	createConnection(function(connection){
	connection.query(sql, function(err, rows, fields){
		if(!err)
			callback(rows);
		else
			console.log(err);
		connection.end();
	});
	});
};

var venueSearch = exports.venueSearch = function(param, callback){
	//var sql = 'SELECT * FROM `tweets` INNER JOIN twitter_users ON tweets.screenID and twitter_users.screenName ="'+user+'"';	
	var sql;
	if(!isNaN(param))
	 sql = 'SELECT * FROM `venues` WHERE (name ='+mysql.escape(param)+' OR lat = '+mysql.escape(param)+' OR "long" = '+mysql.escape(param)+')';	
	else
	 sql = 'SELECT * FROM `venues` WHERE name ='+mysql.escape(param);	
	console.log(sql);
	createConnection(function(connection){
		connection.query(sql, function(err, rows, fields){
			if(!err){
				callback(rows);
				//userTweets(rows[0].twitterID)
			}
			else
				console.log(err);
			connection.end();
		});
	});
};
var venueFourSearch = exports.venueFourSearch = function(param, callback){
	//var sql = 'SELECT * FROM `tweets` INNER JOIN twitter_users ON tweets.screenID and twitter_users.screenName ="'+user+'"';	
	var sql;
	if(!isNaN(param))
	 sql = 'SELECT * FROM `foursqaure_venue` WHERE (name ='+mysql.escape(param)+' OR lat = '+mysql.escape(param)+' OR "long" = '+mysql.escape(param)+')';	
	else
	 sql = 'SELECT * FROM `foursqaure_venue` WHERE name ='+mysql.escape(param);	
	console.log(sql);
	createConnection(function(connection){
		connection.query(sql, function(err, rows, fields){
			if(!err){
				callback(rows);
				//userTweets(rows[0].twitterID)
			}
			else
				console.log(err);
			connection.end();
		});
	});
};
var venueFourSearchId = exports.venueFourSearchId = function(id, callback){
	//var sql = 'SELECT * FROM `tweets` INNER JOIN twitter_users ON tweets.screenID and twitter_users.screenName ="'+user+'"';	
	var sql = 'SELECT * FROM `foursqaure_venue` WHERE (foursqaure_venue.venue_id ='+mysql.escape(id)+')';	
	console.log(sql);
	createConnection(function(connection){
		connection.query(sql, function(err, rows, fields){
			if(!err){
				callback(rows);
				//userTweets(rows[0].twitterID)
			}
			else
				console.log(err);
			connection.end();
		});
	});
};

//venueSearch("1.0")
//venueFourSearch("53.24681026064928");

var usersAtFourVenue = exports.usersAtFourVenue = function(id, callback){
	//var sql = 'SELECT * FROM `foursqaure_venue` INNER JOIN  tweets ON foursqaure_venue.tweet_id_fk  AND foursqaure_venue.venue_id ='+mysql.escape(id);	

	var sql = 'SELECT * FROM foursqaure_venue, tweets, twitter_users WHERE foursqaure_venue.venue_id ='+ mysql.escape(id)+' AND foursqaure_venue.tweet_id_fk = tweets.tweetId'+' AND tweets.screenID = twitter_users.twitterID';	
	console.log(sql);
	createConnection(function(connection){
	connection.query(sql, function(err, rows, fields){
		if(!err)
			callback(rows);

		else
			console.log(err);
		connection.end();
	});
	});
};
var usersAtVenue = exports.usersAtVenue = function(name, callback){
	//var sql = 'SELECT * FROM `foursqaure_venue` INNER JOIN  tweets ON foursqaure_venue.tweet_id_fk  AND foursqaure_venue.venue_id ='+mysql.escape(id);	

	var sql = 'SELECT * FROM venues, tweets, twitter_users WHERE venues.name ='+ mysql.escape(name)+' AND venues.tweet_fk_id = tweets.tweetId'+' AND tweets.screenID = twitter_users.twitterID';	
	console.log(sql);
	createConnection(function(connection){
	connection.query(sql, function(err, rows, fields){
		if(!err)
			callback(rows);

		else
			console.log(err);
		connection.end();
	});
	});
};

//usersAtVenue("4fb259c9e4b0ea9c3a983b24");