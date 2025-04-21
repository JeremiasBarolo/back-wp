const cron = require('node-cron');
const axios = require('axios');

const { 
    insertMasivo,
  
  } = require('../src/controllers/insertController')

const endpoints = [
  'Minería', 'Energía', 'Economía', 'Tecnología', 'MedioAmbiente',
  'Viajes', 'Saludable', 'CodigoRojo', 'Antofagasta',
  'Atacama', 'Coquimbo', 'Comercio', 'Valparaiso',
  'Temuco', 'BioBio', 'Comercio', 'Magallanes'
];

cron.schedule('0 */2 * * *', async () => {
    
  
    for (const tema of endpoints) {
      try {

        console.log(`🔄 Procesando tema: ${tema}`);
        await insertMasivo(tema);
      } catch (err) {
        console.error(`❌ Error en tema [${tema}]:`, err.message);
      }
    }
  });
