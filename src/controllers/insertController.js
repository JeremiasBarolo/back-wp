// const { sqlService } = require('../classes/sqlService');
const  WpApiService  = require('../classes/wpApiService');


const insertMasivo = async (req, res) => {
  try {
    const {username, password, siteurl} = req.body;
    const wpApiService = new WpApiService(siteurl, username, password);

    const response = await wpApiService.insertMasivo();

    console.log('Posts Insertados de manera correcta');
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ action: "insertMasivo", error: err.message });
  }
};




module.exports = {
    insertMasivo
};