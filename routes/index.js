var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Golosinas Para Cumples Junín' });
});

module.exports = router;
