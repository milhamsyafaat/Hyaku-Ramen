var express = require('express');
var { getDb } = require('../db');
var midtrans = require('../services/midtrans');

var router = express.Router();

router.get('/', function (req, res) {
  var config = {};
  if (midtrans.CLIENT_KEY) {
    config.midtrans_client_key = midtrans.CLIENT_KEY;
  }
  try {
    var db = getDb();
    var waNumbers = db.prepare('SELECT number, label, is_default, is_tester FROM wa_numbers WHERE is_active = 1 ORDER BY is_default DESC, is_tester ASC, id ASC').all();
    config.wa_numbers = waNumbers;
  } catch (e) {}
  res.json(config);
});

module.exports = router;
