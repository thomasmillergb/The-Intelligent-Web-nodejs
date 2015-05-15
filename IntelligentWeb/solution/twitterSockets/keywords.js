var keyword_extractor = require("keyword-extractor");

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}
var listOfWords ={};
listOfWords.userWords = [{word: "London", amount: 1, user: "bob"}];
exports.reset = function(){
listOfWords ={};
listOfWords.userWords = [{word: "London", amount: 1, user: "bob"}];
}
//console.log(homes.sort(sort_by('price', true, parseInt)));
/*



var text = "avcbn n@nb @#$%^&* - asdsad asdsad asdsad - a afd,ad saa,, London dadadd, d,, ()";
*/



exports.addWords = function(user, text){
//exports.addText = function(user, text){
	
	var striped = text.replace(/[^a-zA-Z ]/g,"");
	/*
	var arryOfWords = striped.split(/\W/g);
*/
	var extraction_result = keyword_extractor.extract(striped,{
                                                                language:"english",
                                                                remove_digits: true,
                                                                return_changed_case:true,
                                                                remove_duplicates: false
 
                                                           });
	extraction_result.forEach(function(currentWords){
		
		var found = false;
		listOfWords.userWords.forEach(function(obj, i){
			
			if(currentWords == obj.word && user == obj.user){
				listOfWords.userWords[i].amount = obj.amount +1;
				found = true;
				return true;
				
				//add to user and increment by 1
			}


		});
		if(!found){
			listOfWords.userWords.push({word: currentWords, amount: 1, user: user});
		}
	
		else{
		//	console.log(currentWords);
		}

	});
	//return listOfWords;

}

exports.topKeyWords = function( amountOFKeyWords, users){
	//console.log(listOfWords.userWords);
	var topList = [];
	listOfWords.userWords= listOfWords.userWords.sort(sort_by('amount', true,parseInt));
	//console.log(listOfWords.userWords);
	//console.log("hel");
	users.forEach(function(user){
		var count =0;
		var userTop= [];
		listOfWords.userWords.forEach(function(userWord, i){

			if(userWord.user == user && count < amountOFKeyWords){
				userTop.push({word: userWord.word, amount: userWord.amount});
				count += 1;
				
				if(count== amountOFKeyWords){
					return false;
				}
			}

		});
		//console.log(userTop);
		topList.push({user: user, words: userTop});

	});
	//console.log(topList);
	//console.log("hel2");
	return reformatToJamesJson(topList,users);


}
var reformatToJamesJson = function(topList, users){
	//////////////////////////////////
	//need editing for muitple users//
	/////////////////////////////////

//	toplist = [user{[word]}]
	tableJson = {};
	tableJson.users = [];
	
	tableJson.words = [];
	userCount = 0;
	topList.forEach(function(user){
		tableJson.users.push({username:user.user});
		user.words.forEach(function(currentWord){
			
			
			if(tableJson.words.length > 0){   
				var found = false;
    			tableJson.words.forEach(function(tableWord){
    				//console.log(tableWord.word);
    				//console.log(currentWord.word);
    				if(tableWord.word == currentWord.word){
    					//console.log(currentWord.amount);
    					//console.log(userCount);
    					//console.log(tableWord.occurences);
    					tableWord.occurences[userCount] = currentWord.amount;
    					found = true;
    					return true;
    				}
    			});
    			if(!found){
    				tableJson.words.push(addWord(currentWord, userCount, users.length-1));
    			}
			}else{
				tableJson.words.push(addWord(currentWord, userCount, users.length-1));
			}




		});
		userCount += 1;
	});
	//console.log(tableJson);
	return tableJson;

}
var addWord = function(word, currentUser, totalUsers){
	array = [];
	for (i = 0; i <= totalUsers; i++) {
		array.push(0);
	}
	array[currentUser] = word.amount;
	//console.log({word: word.word, occurences:array});
	return {word: word.word, occurences:array};

}