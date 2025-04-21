const cron = require('node-cron');
const axios = require('axios');

const endpoints = [
  'Minería', 'Energía', 'Economía', 'Tecnología', 'MedioAmbiente',
  'Viajes', 'Saludable', 'CodigoRojo', 'Antofagasta',
  'Atacama', 'Coquimbo', 'Comercio', 'Valparaiso',
  'Temuco', 'BioBio', 'Comercio', 'Magallanes'
];

cron.schedule('* * * * *', async () => {
  console.log('⏰ Ejecutando cron cada 2 horas');

  for (const categoria of endpoints) {
    // const url = `http://34.232.188.56:8080/insert/${categoria}`;
    const url = `http://localhost:8080/insert/${categoria}`;
    try {
      const res = await axios.post(url);
      console.log(`✅ ${categoria} ->`, res.status);
    } catch (err) {
      console.error(`❌ Error en ${categoria} ->`, err.message);
    }
  }
});
