const cron = require('node-cron');
const axios = require('axios');
const logger = require('../src/utils/logger');


const { 
    insertMasivo,
  
  } = require('../src/controllers/insertController')

const endpoints = [
  'Minería', 'Energía', 'Economía', 'Tecnología', 'MedioAmbiente',
  'Viajes', 'Saludable', 'CodigoRojo', 'Antofagasta',
  'Atacama', 'Coquimbo', 'Comercio', 'Valparaiso',
  'Temuco', 'BioBio', 'Comercio', 'Magallanes',
  'GiGi', 'Vibra', 'Neon'
];

cron.schedule('0 */4 * * *', async () => {
  logger.info(`⏰ Inicio del proceso masivo [${new Date().toLocaleString()}]`);

  for (const tema of endpoints) {
    try {
      logger.info(`▶️ Iniciando tema: ${tema}`);
      await insertMasivo(tema);
    } catch (err) {
      logger.error(`❌ Falló el tema ${tema}: ${err.message}`);
    }
  }

  logger.info(`✅ Proceso masivo completo [${new Date().toLocaleString()}] \n`);
});
