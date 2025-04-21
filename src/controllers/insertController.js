const  WpApiService  = require('../classes/wpApiService');
const database = require('../db/database');



const insertMasivo = async (req, res) => {
  try {
   
    const { query, release } = await database.connection();
    const {tema} = req.params;

    if (!tema) {
        return res.status(400).json({ error: 'El tema es obligatorio' });
    }

    const [{url}] = await query('SELECT url FROM red_mira WHERE tema = ?',[tema])

    release()
    

    const wpApiService = new WpApiService(url);

    const response = await wpApiService.insertMasivo(tema);
    if(response){
      res.json('Posts Insertados de manera correcta');
    }else{
      res.json('No hay noticias disponibles para el tema especificado.');
    }
    
  } catch (err) {
    res.status(500).json({ action: "insertMasivo", error: err.message });
  }
};




module.exports = {
    insertMasivo
};