const cron = require('node-cron');
const axios = require('axios');
import { insertController } from '../src/controllers';

const endpoints = [
  'Minería', 'Energía', 'Economía', 'Tecnología', 'MedioAmbiente',
  'Viajes', 'Saludable', 'CodigoRojo', 'Antofagasta',
  'Atacama', 'Coquimbo', 'Comercio', 'Valparaiso',
  'Temuco', 'BioBio', 'Comercio', 'Magallanes'
];

cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Ejecutando insertMasivoPorTema cada 2 horas');
  
    for (const tema of endpoints) {
      try {
        await insertController.insertMasivo(tema);
      } catch (err) {
        console.error(`❌ Error en tema [${tema}]:`, err.message);
      }
    }
  });
