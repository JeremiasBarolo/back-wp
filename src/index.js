const express = require('express');
const app = express();
require('dotenv').config(); 


// routes
const { 
  insertRouter,

} = require('./routes')

app.use('/insert', insertRouter);








app.listen(8080, () => {
  console.log(`Server running on port ${8080}, environment: ${process.env.DB_PORT}`);
});




  
