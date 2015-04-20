var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}


exports.venues = function(currentData, venues){
    if (currentData["coordinates"] || currentData.place) {
        
		//console.log(currentData);
        marker = {};

        if(null != currentData.place)
        	marker.venue = currentData.place.full_name;
        else{
        	marker.venue = "Unknowed";
        	}
        //console.log(marker.venue);
        if(currentData["coordinates"] && currentData.coordinates.coordinates[1]){

        	//improvement find long and lat from place name
	        marker.lat = currentData.coordinates.coordinates[1];
	        marker.long = currentData.coordinates.coordinates[0];
	        marker.label = "<h3>@" + currentData.user.screen_name + "</h3>" + currentData.text + "";
    	}
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
        
	}
	
	//var visitedVenuesJson = [{"venue":"Sheffield", "lat":"53.371143", "long":"-1.392339", "visits":"2"},{"venue":"Sheffield 2", "lat":"53.371143", "long":"-1.38", "visits":"1"}];
	venues = venues.sort(sort_by('visits', true,parseInt));
	//console.log(venues);


	return venues;
}

exports.users = function(currentUser, usersList){

	user = {};
	user.user = currentUser.screen_name;
	user.user_id = currentUser.id;

	if(usersList.length == 0){
		user.visits = 1;
		usersList.push(user);
	}

	else
	{
		var found = false;
		usersList.forEach(function(person){
			
	    	if(person.user_id == user.user_id){
	    		person.visits += 1;
	    		//console.log(person.user_id);
	    		found = true
	    		return true;
	   		}

		});
		if(!found){
			user.visits = 1;
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