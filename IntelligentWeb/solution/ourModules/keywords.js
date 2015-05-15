var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

var listOfWords.userWords = [{word: "London", amount: 1, user: "bob"}];
//console.log(homes.sort(sort_by('price', true, parseInt)));
/*
var listOfWords ={};


var text = "avcbn n@nb @#$%^&* - asdsad asdsad asdsad - a afd,ad saa,, London dadadd, d,, ()";
*/



exports.addWords = function(user, text){
//exports.addText = function(user, text){
	var striped = text.replace(/[^a-zA-Z ]/g,"");
	var arryOfWords = striped.split(/\W/g);

	arryOfWords.forEach(function(currentWords){
		if(currentWords != '')
			if(!listOfWords.userWords.forEach(function(obj, i){
				
				if(currentWords == obj.word && user == obj.user){
					listOfWords.userWords[i].amount = obj.amount +1;
					return false;
					
					//add to user and increment by 1
				}


			})){
				listOfWords.userWords.push({word: currentWords, amount: 1, user: user});
			}
	

	});

}
/*
test("bob");
test("bobb");
test("bobb3");
*/

exports.topKeyWords = function(amountOFKeyWords, users){
	var topList = [];
	
	listOfWords.userWords= listOfWords.userWords.sort(sort_by('amount', true,parseInt));
	users.forEach(function(user){
		var count =0;
		var userTop= [];
		listOfWords.userWords.forEach(function(userWord, i){
			if(userWord.user == user){
				userTop.push({word: userWord.word, amount: userWord.amount});
				count += 1;
				if(count== amountOFKeyWords) 
					return false;
			}

		});
		topList.push({user: user, words: userTop});

	});
	return topList;


}