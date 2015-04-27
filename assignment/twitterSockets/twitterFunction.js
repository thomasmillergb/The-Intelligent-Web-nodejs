var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}


exports.venues = function(currentData, venues, sortbydate){
    if (currentData["coordinates"] || currentData.place) {
        
        marker = {};
        
        marker.date = parseTwitterDate(currentData.created_at);

        if(null != currentData.place)
        	marker.venue = currentData.place.full_name;
        else
        	marker.venue = "Unknowed";

        if(currentData["coordinates"] && currentData.coordinates.coordinates[1]){

        	//improvement find long and lat from place name
	        marker.lat = currentData.coordinates.coordinates[1];
	        marker.long = currentData.coordinates.coordinates[0];
	        marker.label = "<h3>@" + currentData.user.screen_name + "</h3>" + currentData.text + "";
    	}

        if(venues.length == 0){
        	marker.visits = 1;
        	venues.push(marker);
        }
        else
        {
        	var found = false;
        	venues.forEach(function(venue){
            	if(venue.venue == marker.venue) {
            		venue.visits += 1;
            		if (marker.date > venue.date)
            			venue.date = marker.date.toString();
            		found = true
            		return true
            	}
        	});
        	if(!found){
            		marker.visits = 1;
            		marker.date = marker.date.toString();
        			venues.push(marker);
            }

        	
        }
        
	}
	
	//var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];
	
	if (sortbydate !== undefined && sortbydate == true)
	    venues = venues.sort(sort_by('date', true,parseInt));
	else
		venues = venues.sort(sort_by('visits', true,parseInt));

	return venues;
}

exports.users = function(currentUser, usersList){

	user = {};
	user.user = currentUser.user.screen_name;
	user.user_id = currentUser.user.id;
	user.date = parseTwitterDate(currentUser.created_at);

	if(usersList.length == 0){
		user.visits = 1;
		usersList.push(user);
	} else {
		var found = false;
		usersList.forEach(function(person){
			
	    	if(person.user_id == user.user_id){
	    		person.visits += 1;
	    		
	    		if (user.date > person.date)
            			person.date = user.date.toString();
	    		
	    		found = true
	    		return true;
	   		}

		});
		if(!found){
			user.visits = 1;
			user.date = user.date.toString();
			usersList.push(user);

		}
	}
	return usersList;
}

exports.users_discussion = function(currentData, currentUser){

	if(currentUser.length == 0){
		currentUser.push({username: currentData.user.screen_name, user_id:currentData.user.id});
	}
	else{
		var found = false;
		currentUser.forEach(function(user, i){
		    if(user.username ==  currentData.user.screen_name) {
		    	found = true;
		    	return true;
		    }

		});
		if(!found){
			currentUser.push({username: currentData.user.screen_name, user_id:currentData.user.id});
		}
	}
	return currentUser;
}

function parseTwitterDate(aDate) {   
	return new Date(Date.parse(aDate.replace(/( \+)/, ' UTC$1')));
}