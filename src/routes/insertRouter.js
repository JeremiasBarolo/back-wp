const express = require('express');
const router = express.Router();
const { 
    insertController
 
 } = require('../controllers');


router.post('/postMasivos', insertController.insertMasivo);


module.exports = router;


