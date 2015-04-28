 
var request = require('deferred').promisify(require("request"));

function expandUrl(shortUrl, callback) {
    callback(request( { method: "HEAD", url: shortUrl, followAllRedirects: true } )
        .get(0, 'request', 'href'));
}

expandUrl("http://t.co/Xx5puY2Hhy",function(callback){

console.log(callback);	
});


 /*var http = require('http')
var options = {
  host: 't.co',
  port: 80,
  path: '/oN9zWeBjgp',
  method: 'GET'
};
var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();
*/

  /*var Q = require("q");
  var request = require("request");
   function expandUrl(shortUrl) {
        return Q.fcall(request, null, {
            method: "HEAD",
            url: shortUrl,
            followAllRedirects: true
        // If a callback receives more than one (non-error) argument
        // then the promised value is an array. We want element 0.
        }).get('0').get('request').get('href');
    }

   expandUrl("http://t.co/oN9zWeBjgp")
    .then(function (longUrl) {
    	console.log("sada");
        console.log(longUrl);
    });

*/

/*
var urlExpander=require('expand-url');
 
urlExpander.expand('https://www.swarmapp.com/killermillergb/checkin/553e8c51498e5fab43311800?s=i99CIg3xlulVGyFAdyr0W8Kc_ig&ref=tw', function(err, longUrl){
    console.log(longUrl);
});
/*
var request = require("request");
var async = require('async');
var urlExpander = require('expand-url');
 
var counter=0;

var q = async.queue(function (shortUrl, callback) {
    urlExpander.expand(shortUrl, function(err, longUrl){
        counter++;
        console.log(counter+": "+longUrl);
        callback();
    });
}, 100);
 
q.drain = function() {
    console.log(counter);
    console.log('all urls have been processed');
}
 

var i = 0;
while (i< 2){
    q.push("http://t.co/oN9zWeBjgp");
}
*/