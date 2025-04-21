// services/insertMasivoService.js
const WpApiService = require('../classes/wpApiService');
const database = require('../db/database');

const insertMasivo= async (tema) => {
  if (!tema) throw new Error('El tema es obligatorio');

  const { query, release } = await database.connection();
  try {
    const [{ url }] = await query('SELECT url FROM red_mira WHERE tema = ?', [tema]);
    release();

    const wpApiService = new WpApiService(url);
    const response = await wpApiService.insertMasivo(tema);

    if (response) {
      console.log(`✅ [${tema}] Posts insertados correctamente`);
      return true;
    } else {
      console.log(`⚠️ [${tema}] No hay noticias disponibles`);
      return false;
    }
  } catch (err) {
    release();
    console.error(`❌ [${tema}] Error en insertMasivoPorTema:`, err.message);
    throw err;
  }
};

module.exports = { insertMasivo };
