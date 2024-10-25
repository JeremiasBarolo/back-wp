const express = require('express');
const router = express.Router();
const { insertMasivo, TESTCONNECTION } = require('../controllers/insertController');

router.get('/', TESTCONNECTION );
router.get('/insertMasivo', insertMasivo);

module.exports = router;