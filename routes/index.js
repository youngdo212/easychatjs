var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.isLogined) return res.redirect('/auth/signin');

  const nickname = req.session.nickname;

  res.render('index', {nickname});
});

module.exports = router;
