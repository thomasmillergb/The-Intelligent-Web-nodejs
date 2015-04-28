var fourFunction = require('./commonFourSqaureFunctions.js')


exports.getVenues  = function(tweets, callback){
	console.log(Array.isArray(tweets));
	if(Array.isArray(tweets))
	fourFunction.getFourSquareFromTweets(tweets, function(checkins){
		callback(checkins);
	});
	else
	fourFunction.getFourSquareFromTweetsLive(tweets, function(checkins){
		callback(checkins);
	});

}



function findVenues(latitude, longitude, radius) {

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
                console.log(body)
            }
            else console.log('error: ' + response.statusCode + ' response: ' + JSON.parse(response.body).meta.errorDetail);
        });
}

//findVenues(53.3829700, -1.4659000, 500, accessToken);

exports.venues = function(checkin, venues){
    
   
    marker = {};
    marker.venue = checkin.venue.name;
    marker.lat = checkin.venue.location.lat;
    marker.long = checkin.venue.location.lng;
    marker.label = "<h3>@" + checkin.user.firstName + " "+ checkin.user.lastName+  "</h3>" + checkin.shout + "";
	marker.date = checkin.createdAt*1000;
    //console.log(checkin);
    //console.log(currentData);	
    //console.log(marker);
    if(venues.length == 0){
    	marker.visits = 1;
    	venues.push(marker);
    }
    else
    {
    	var found = false;
    	venues.forEach(function(venue){
        	if(venue.venue == marker.venue){
        		venue.visits += 1;
        		found = true
        		return true
        	}
    	});
    	if(!found){
        		marker.visits = 1;
    			venues.push(marker);
        }
    }
	//var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];
	venues = venues.sort(sort_by('date', true,parseInt));
	//console.log(venues);


	return venues;
}

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}
