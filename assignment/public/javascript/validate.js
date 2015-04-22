//things I need to add to the HTML:
//attr-validate = string [alphanumeric, numeric, latlong]
//attr-nonEmpty = boolean
//attr-latlong

var alphanumericRegex = /^[-\w\s]+$/; //regex to check for alphanumeric characters
var usernameRegex = /^[A-Za-z0-9_]{1,15}$/; //regex to check twitter usernames
var multiUsernameRegex = /^([A-Za-z0-9_]{1,15}[,\s]*)+$/; //regex to check twitter usernames

	
function ValidateForm(form) {

	$("*").removeClass("validation_fail");
	
	var alphanumericelements = form.find("input[attr-validate=alphanumeric]");
	var usernameelements = form.find("input[attr-validate=username]");
	var multiusernameelements = form.find("input[attr-validate=multipleusername]");
	var numericelements = form.find("input[attr-validate=numeric]");
	var nonempty = form.find("input[attr-nonEmpty=true]");
	var latlong = form.find("input[attr-validate=latlong]");

	//Alphanumeric Check
	for (var i = 0; i < alphanumericelements.length; i++)
	{
		if (alphanumericRegex.test($(alphanumericelements[i]).val()) == false) { 
			addNotification("Invalid input!", "Please enter a valid search term in " + $(alphanumericelements[i]).attr("name"), 5000);
			loadingOverlay(false);
			$(alphanumericelements[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false; //if it doesn't, fail the form
		}
	}
	
	//Username Check
	for (var i = 0; i < usernameelements.length; i++)
	{
		
		
		if (usernameRegex.test($(usernameelements[i]).val()) == false) { 
			addNotification("Invalid input!", "Please enter a valid Twitter username in " + $(alphanumericelements[i]).attr("name"), 5000);
			loadingOverlay(false);
			$(alphanumericelements[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false; //if it doesn't, fail the form
		}
	}
	
	//Multiple Username Check
	for (var i = 0; i < multiusernameelements.length; i++)
	{

		if (multiUsernameRegex.test($(multiusernameelements[i]).val()) == false) { 
			addNotification("Invalid input!", "Please enter a valid list of Twitter usernames in " + $(alphanumericelements[i]).attr("name"), 5000);
			loadingOverlay(false);
			$(alphanumericelements[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false; //if it doesn't, fail the form
		}
	}
	
	//Numeric check
	for (var i = 0; i < numericelements.length; i++)
	{
		if (isNaN($(numericelements[i]).val())) { 
			console.log("did a numeric");
			addNotification("Invalid input!", "Please use only numeric values in " + $(numericelements[i]).attr("name"), 5000);
			loadingOverlay(false);
			$(numericelements[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false; //
		}
	}
	
	//nonEmpty check
	for (var i = 0; i < nonempty.length; i++)
	{
		//check the string is nonempty
		if ($(nonempty[i]).val() == "") { 
			addNotification("Invalid input!", "Please enter a value in " + $(nonempty[i]).attr("name"), 5000);
			loadingOverlay(false);
			$(nonempty[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false; //
		}
	}
	
	//latLong check
	for (var i = 0; i < latlong.length; i++)
	{
		var latlonnum = $(latlong[i]).val();
		var latlonname = $(latlong[i]).attr("name"); //"lat" or "long"
		//check the string is a valid latitude/longtitude value
		if (isNaN(latlonnum)) { 
			addNotification("Validation failed", "Please enter a number in " + latlonname, 5000);
			loadingOverlay(false);
			$(latlong[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false;
		
		} else if (latlonname == "lat") {
			if (latlonnum > 90 || latlonnum < -90) {
			addNotification("Validation failed", "Please enter a number between -90 and +90 in " + latlonname, 5000);
			loadingOverlay(false);
			$(latlong[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false;
			}
		} else if (latlonname == "long") {
			if (latlonnum > 180 || latlonnum < -180) {
			addNotification("Validation failed", "Please enter a number between -180 and +180 in " + latlonname, 5000);
			loadingOverlay(false);
			$(latlong[i]).addClass("validation_fail");
			$("html, body").animate({scrollTop: 0});
			return false;
			}
		}
	}
	
	return true;
}







