var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Social Tracker' });
});
router.get('/auth/twitter/callback', function(req, res, next) {
  res.render('endoftwit', { title: 'Social Tracker' });
});
router.get('/endoftwit', function(req, res, next) {
  res.render('endoftwit', { title: 'Social Tracker' });
});
module.exports = router;
