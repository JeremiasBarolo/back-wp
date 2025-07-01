const cron = require('node-cron');
const logger = require('../src/utils/logger');
const { insertMasivo } = require('../src/controllers/insertController');

const endpoints = [
  { nombre: "Antofagasta", url: "http://200.111.128.26:50888/datos?Tema=Antofagasta" },
  { nombre: "Atacama", url: "http://200.111.128.26:50888/datos?Tema=Atacama" },
  { nombre: "BioBio", url: "http://200.111.128.26:50888/datos?Tema=Biobío" },
  { nombre: "Bienestar", url: "http://200.111.128.26:50888/datos?Tema=Bienestar" },
  { nombre: "CodigoRojo", url: "http://200.111.128.26:50888/datos?Tema=CodigoRojo" },
  { nombre: "Coquimbo", url: "http://200.111.128.26:50888/datos?Tema=Coquimbo" },
  { nombre: "Emprendimiento", url: "http://200.111.128.26:50888/datos?Tema=Emprendimiento" },
  { nombre: "Economía", url: "http://200.111.128.26:50888/datos?Tema=Energía" },
  { nombre: "Finanzas", url: "http://200.111.128.26:50888/datos?Tema=Finanzas" },
  { nombre: "Temuco", url: "http://200.111.128.26:50888/datos?Tema=La%20Araucanía" },
  { nombre: "Magallanes", url: "http://200.111.128.26:50888/datos?Tema=Magallanes" },
  { nombre: "Minería", url: "http://200.111.128.26:50888/datos?Tema=Minería" },
  { nombre: "Comercio", url: "http://200.111.128.26:50888/datos?Tema=Retail" },
  { nombre: "Tecnología", url: "http://200.111.128.26:50888/datos?Tema=Tecnología" },
  { nombre: "Viajes", url: "http://200.111.128.26:50888/datos?Tema=Turismo" },
  { nombre: "Valparaiso", url: "http://200.111.128.26:50888/datos?Tema=Valparaíso" }
];


const ejecutarMasivoLoop = async () => {
  logger.info(`⏰ Inicio del proceso masivo [${new Date().toLocaleString()}]`);

  for (const tema of endpoints) {
    try {
      logger.info(`▶️ Iniciando tema: ${tema.nombre}`);
      await insertMasivo(tema.nombre, tema.url);
    } catch (err) {
      logger.error(`❌ Falló el tema ${tema.nombre}: ${err.message}`);
    }
  }

  logger.info(`✅ Proceso masivo completo [${new Date().toLocaleString()}]`);

  // Esperar 1 hora (3600000 ms)
  logger.info(`⏳ Esperando 1 hora para volver a iniciar...`);
  setTimeout(ejecutarMasivoLoop, 60 * 60 * 1000);
};

// Iniciar loop
ejecutarMasivoLoop();
