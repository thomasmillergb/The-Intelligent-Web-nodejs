/*
 * the routes file, not really used because everything is done in the twitterFunction.JS
 */
var socket = require('../twitterSockets/main.js');
exports.index = function(req, res, callbacks) {
    res.render('index', {
        title: 'Group N+1'
    });
};
//router.get('/auth/twitter/callback'
//Gets the foursqaure token
exports.authTwitter = function(req, res, next) {
    console.log("callback");
    console.log(req.session.oauth);
    res.render('endoftwit', {
        title: 'Social Tracker',
        oauth: req.session.oauth
    });
};
//Gets the twitter token
exports.endoftwit = function(req, res, next) {
    res.render('endoftwit', {
        title: 'Social Tracker',
        oauth: req.session.oauth
    });
};