var fourFunction = require('./commonFourSqaureFunctions.js')
    /**
gets all the checkin from the tweets

param tweets the tweets from the api
param accessToken the client access token
param callback  returns all the checkins
*/
exports.getVenues = function(tweets, accessToken, callback) {
        if (Array.isArray(tweets)) fourFunction.getFourSquareFromTweets(tweets, accessToken, function(checkins) {
            callback(checkins);
        });
        else fourFunction.getFourSquareFromTweetsLive(tweets, accessToken, function(checkins) {
            callback(checkins);
        });
    }
    /**
gets details of a venue

param location  the venue
param accessToken the client access token
param callback  returns the venue search for
*/
exports.getVenuesFromLocation = function(location, accessToken, callback) {
        fourFunction.getVenuesFromLocation(location, accessToken, function(err, data) {
            callback(err, data);
        });
    }
    /**
gets details of a venue


unused
function findVenues(latitude, longitude, radius,accessToken) {

// Configure the request
    var options = {
        // localhost does not work if you run from localhost the server itself
        url: 'https://api.foursquare.com/v2/venues/search',
        method: 'GET',
        headers: headers,
        qs: {'ll': latitude + ',' + longitude, 'radius': radius, 'oauth_token': accessToken,
            'v': '20140806', m: 'swarm'}
    }

// Start the request
    request(options,
        function (error, response, body) {

            if (!error && response.statusCode == 200) {
                // Print out the response body
                //console.log(body)
            }
            else console.log('error: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
        });
}
*/
    //findVenues(53.3829700, -1.4659000, 500, accessToken);
    /**
added the check in to the list of venues and sorts. The deatils required for frontend are added to the venues.
if a user has visted the venue, the venue is incremented

param checkinAndID  the current checkin
param venues a array of venues
return venues  returns a sorted venues with the new checkin
*/
exports.venues = function(checkinAndID, venues) {
        var checkin = checkinAndID.checkin;
        //checkinAndID.tweetID;
        marker = {};
        //console.log(checkinAndID.screen_name);
        marker.user_id = checkinAndID.twitterID;
        marker.screen_name = checkinAndID.user;
        //console.log(checkinAndID);
        //console.log(checkin);
        marker.venue = checkin.venue.name;
        marker.lat = Math.floor(checkin.venue.location.lat * Math.pow(10, 8)) / Math.pow(10, 8);
        marker.long = Math.floor(checkin.venue.location.lng * Math.pow(10, 8)) / Math.pow(10, 8);
        // detaled veune
        if (checkin.venue.rating != null) {
            marker.rating = checkin.venue.rating;
        } else {
            marker.rating = "Not yet rated";
        }
        if (checkin.venue.location.formattedAddress != null) marker.formattedAddress = checkin.venue.location.formattedAddress
        else marker.formattedAddress = "No address found"
        if(checkin.venue.likes !=null)
            marker.likes = checkin.venue.likes.count;
        else marker.likes = 0;
        marker.shortUrl = checkin.venue.shortUrl;
        marker.foursquare = true;
        marker.bestPhoto = {};
        if (checkin.venue.description != null) {
            marker.description = checkin.venue.description;
        } else {
            marker.description = "No description for venue";
        }
        if (checkin.venue.bestPhoto == null) {
            if (checkin.venue.categories.length == 0 || checkin.venue.categories == null) {
                marker.bestPhoto.prefix = " ";
                marker.bestPhoto.suffix = " ";
                marker.bestPhoto = " ";
            } else {
                marker.bestPhoto.prefix = checkin.venue.categories[0].icon.prefix;
                marker.bestPhoto.suffix = checkin.venue.categories[0].icon.suffix;
                marker.bestPhoto.url = marker.bestPhoto.prefix + "64" + marker.bestPhoto.prefix;
            }
        } else {
            //console.log(checkin.venue.bestPhoto);
            marker.bestPhoto.prefix = checkin.venue.bestPhoto.prefix;
            marker.bestPhoto.suffix = checkin.venue.bestPhoto.suffix;
            marker.bestPhoto.height = checkin.venue.bestPhoto.height;
            marker.bestPhoto.width = checkin.venue.bestPhoto.width;
            marker.bestPhoto = checkin.venue.bestPhoto.prefix + marker.bestPhoto.width + "x" + marker.bestPhoto.height + checkin.venue.bestPhoto.suffix;
        }
        marker.label = "<h3>@" + checkin.user.firstName + " " + checkin.user.lastName + "</h3>" + checkin.shout + "";
        marker.date = checkin.createdAt * 1000;
        //console.log(checkin);
        //console.log(currentData); 
        //console.log(marker);
        if (venues.length == 0) {
            marker.visits = 1;
            venues.push(marker);
        } else {
            var found = false;
            venues.forEach(function(venue) {
                if (venue.venue == marker.venue) {
                    venue.visits += 1;
                    found = true
                    return true
                }
            });
            if (!found) {
                marker.visits = 1;
                venues.push(marker);
            }
        }
        //var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];
        venues = venues.sort(sort_by('date', true, parseInt));
        //console.log(venues);
        return venues;
    }
    /**
added the check in to the list of venues and sorts the users. The deatils required for frontend are added to the venues
if a user has visted the venue, the venue is incremented

param checkinAndID  the current checkin
param venues a array of venues
return venues  returns a venues  sorted by users with the new checkin
*/
exports.userVenues = function(checkinAndID, venues) {
        var checkin = checkinAndID.checkin;
        //checkinAndID.tweetID;
        marker = {};
        //console.log(checkinAndID.screen_name);
        marker.user_id = checkinAndID.twitterID;
        marker.user = checkinAndID.screen_name;
        marker.foursquare = true;
        marker.venue = checkin.venue.name;
        marker.lat = Math.floor(checkin.venue.location.lat * Math.pow(10, 8)) / Math.pow(10, 8);
        marker.long = Math.floor(checkin.venue.location.lng * Math.pow(10, 8)) / Math.pow(10, 8);
        marker.label = "<h3>@" + checkin.user.firstName + " " + checkin.user.lastName + "</h3>" + checkin.shout + "";
        marker.date = checkin.createdAt * 1000;
        // detaled veune
        if (checkin.venue.rating != null) {
            marker.rating = checkin.venue.rating;
        } else {
            marker.rating = "Not yet rated";
        }
        if (checkin.venue.location.formattedAddress != null) marker.formattedAddress = checkin.venue.location.formattedAddress
        else marker.formattedAddress = "No address found"
        marker.likes = checkin.venue.likes.count;
        marker.rating = checkin.venue.rating;
        marker.shortUrl = checkin.venue.shortUrl;
        marker.bestPhoto = {};
        if (checkin.venue.description != null) {
            marker.description = checkin.venue.description;
        } else {
            marker.description = "No description for venue";
        }
        if (checkin.venue.bestPhoto == null) {
            if (checkin.venue.categories.length == 0 || checkin.venue.categories == null) {
                marker.bestPhoto.prefix = " ";
                marker.bestPhoto.suffix = " ";
                marker.bestPhoto = " ";
            } else {
                marker.bestPhoto.prefix = checkin.venue.categories[0].icon.prefix;
                marker.bestPhoto.suffix = checkin.venue.categories[0].icon.suffix;
                marker.bestPhoto.url = marker.bestPhoto.prefix + "64" + marker.bestPhoto.prefix;
            }
        } else {
            marker.bestPhoto.prefix = checkin.venue.bestPhoto.prefix;
            marker.bestPhoto.suffix = checkin.venue.bestPhoto.suffix;
            marker.bestPhoto.height = checkin.venue.bestPhoto.height;
            marker.bestPhoto.width = checkin.venue.bestPhoto.width;
            marker.bestPhoto = checkin.venue.bestPhoto.prefix + marker.bestPhoto.width + "x" + marker.bestPhoto.height + checkin.venue.bestPhoto.suffix;
        }
        if (venues.length == 0) {
            marker.visits = 1;
            venues.push(marker);
        } else {
            var found = false;
            venues.forEach(function(user) {
                if (user.user == marker.user) {
                    user.visits += 1;
                    found = true
                    return true
                }
            });
            if (!found) {
                marker.visits = 1;
                venues.push(marker);
            }
        }
        //var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];
        venues = venues.sort(sort_by('date', true, parseInt));
        //console.log(venues);
        return venues;
    }
    //var venueUserVistorsJson = [{"user":"jtmcilveen", "user_id":"839249234", "visits":"5"},{"user":"fabcirca", "user_id":"839249235", "visits":"2"}];
var sort_by = function(field, reverse, primer) {
    var key = primer ? function(x) {
        return primer(x[field])
    } : function(x) {
        return x[field]
    };
    reverse = !reverse ? 1 : -1;
    return function(a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
}