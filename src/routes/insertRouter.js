const express = require('express');
const router = express.Router();
const { insertMasivo } = require('../controllers/insertController');

router.get('/', insertMasivo);
router.get('/insertMasivo', insertMasivo);

module.exports = router;