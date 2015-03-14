var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Social Tracker - Team N+1' });
});

router.post('/', function(req, res, next) {
	//console.log(req);
	console.log(req.body);
  res.render('index', { title: 'Social Tracker - Team N+1', req.body});

});

router.get('/auth/twitter/callback', function(req, res, next) {
	console.log("callback");
	console.log(req.session.oauth);
	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth});
});
router.get('/endoftwit', function(req, res, next) {
	//console.log("endoftwit");
	//console.log(req.session.oauth);
	res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth });
});



/*
router.get('/endoffour', function(req, res, next) {
  res.render('endoftwit', { title: 'Social Tracker', oauth:req.session.oauth });
  console.log(req.session.oauth);

});
*/
module.exports = router;
