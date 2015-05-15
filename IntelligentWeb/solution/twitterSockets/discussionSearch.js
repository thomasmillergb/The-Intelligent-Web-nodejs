exports.discussionSearch = function(params, callback){	
	console.log("discussion_search params:");
	
	// params.search
	// params.liveresults
	// params.uselocation
	// params.radius
	// params.lat
	// params.long
	
	for (var index in params) {
		console.log("    params." + index + ": \"" + params[index] + "\"");
	}
	
	var data = {};
	
	// Use streaming API
	
	filterParams = {};
	
	if (params.search != '')
	  filterParams["track"] =  [params.search];
	
	if (params.uselocation) {
	  var bounds = getBoundingBox([params.lat, params.long], params.radius);
	  filterParams['locations'] = bounds[1] + "," + bounds[0] + "," + bounds[3] + "," + bounds[2];
	  console.log(bounds);
	}
	
	if (params.liveresults) {		
		currentTwitStream = twitterAPI.stream('statuses/filter', filterParams,function (stream) {
			
            

            stream.on('data', function (data) {
                
                var tempData = {};
                tempData.tweet = data;
                tempData.marker = [];
                // Its geotaggggeddd! Yaaaay
               
	     		tempData.marker = twitterFunctions.venues(data,tempData.marker)[0];

                //console.log(data.user.screen_name + " : " + data.text);
                io.sockets.emit('stream_discussion_search', tempData);
                // throw  new Exception('end');
            });
            
            twitterAPI.currentDiscussionStream = stream;
        });
        
        socket.on('discussion_search_stop_stream', function(fn) {
            
            if (twitterAPI.currentDiscussionStream != undefined) {
				twitterAPI.currentDiscussionStream.destroy();
				twitterAPI.currentDiscussionStream = undefined;
            }
            
            return fn();
      
        });
        
        fn();
	
	// Use REST API
	} else {
		var searchParams;
		if(params.uselocation)
			searchParams = { q: params.search, geocode: [params.lat, params.long, params.radius + "mi" ], count: 200 };
		else
			searchParams = { q: params.search, count: 200 };

		    twitterRestAPI.get('search/tweets', searchParams, function(err, data, response) {
                if(!err){
                	var venues =[];
	                for (var indx in data.statuses) {
	                	var currentData = data.statuses[indx];
	     				venues = twitterFunctions.venues(currentData,venues);
	                }
            
	            
	            data.markers = venues;
				data.tweets = data.statuses;
				fn(null, data);
			}
			else{

				console.log(err);
			}
        })
	}
}