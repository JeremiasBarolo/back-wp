require('../scripts/cron-tareas');
const express = require('express');
const app = express();
require('dotenv').config(); 

app.use(express.json());


// routes
const { 
  insertController,

} = require('./controllers')


// app.post('/insert/:tema', insertController.insertMasivo);










app.listen(8080, () => {
  console.log(`Server running on port ${8080}, environment: ${process.env.DB_PORT}`);
});




  
