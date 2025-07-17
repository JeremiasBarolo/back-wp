const WpApiService = require('../classes/wpApiService');
const database = require('../db/database');
const logger = require('../utils/logger');
const axios = require('axios');

const insertMasivo= async (tema, url_nota) => {
  if (!tema) throw new Error('El tema es obligatorio');

  const { query, release } = await database.connection();
  try {
    const [{ url }] = await query('SELECT url FROM red_mira WHERE tema = ?', [tema]);
    release();

    const wpApiService = new WpApiService(url);
    const response = await wpApiService.insertMasivo(tema, url_nota);

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




const testTemas = async (req, res) => {
  const endpoints = [
    { nombre: "Vibra", url: "http://200.111.128.26:50888/datos?Tema=Deportes" },
    { nombre: "CodigoRojo", url: "http://200.111.128.26:50888/datos?Tema=C%C3%B3digo%20Rojo" },
    { nombre: "Neon", url: "http://200.111.128.26:50888/datos?Tema=Cultura%20Online" },
    { nombre: "Sustentable", url: "http://200.111.128.26:50888/datos?Tema=Sustentabilidad" },
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
    { nombre: "Turismo", url: "http://200.111.128.26:50888/datos?Tema=Turismo" },
    
    
  ];

  try {
    const testResults = [];

    for (const tema of endpoints) {
      const temaResult = {
        tema: tema.nombre,
        url: `${tema.url}`,
        status: 'pending',
        itemsTested: 0,
        itemsSuccessful: 0,
        itemsFailed: 0,
        itemDetails: [],
        error: null
      };

      try {
        logger.info(`▶️ Iniciando tema: ${tema.nombre}`);
        const response = await axios.get(temaResult.url);
        
        const testItems = response.data.slice(0, 20);
        temaResult.itemsTested = testItems.length;
        temaResult.status = 'testing_images';

        
        for (const [index, item] of testItems.entries()) {
          const itemResult = {
            itemIndex: index,
            imageUrl: item.Imagen, 
            status: 'pending',
            response: null,
            error: null
          };

          try {
            // Test the image URL
            const imageResponse = await axios.head(item.Imagen, { timeout: 5000 });
            itemResult.status = 'success';
            itemResult.response = {
              status: imageResponse.status,
              headers: imageResponse.headers
            };
            temaResult.itemsSuccessful++;
          } catch (imgError) {
            itemResult.status = 'failed';
            itemResult.error = {
              message: imgError.message,
              code: imgError.code
            };
            temaResult.itemsFailed++;
          }

          temaResult.itemDetails.push(itemResult);
        }

        temaResult.status = temaResult.itemsFailed === 0 ? 'complete_success' : 'partial_success';
        logger.info(`✅ Tema ${tema.nombre} - ${temaResult.itemsSuccessful}/${temaResult.itemsTested} imágenes OK`);

      } catch (error) {
        temaResult.status = 'failed';
        temaResult.error = {
          message: error.message,
          code: error.code
        };
        logger.error(`❌ Fallo al procesar tema ${tema}: ${error.message}`);
      }

      testResults.push(temaResult);
    }

    // Generate summary
    const summary = {
      totalTopics: endpoints.length,
      topicsTested: testResults.length,
      topicsSuccessful: testResults.filter(r => r.status.includes('success')).length,
      topicsFailed: testResults.filter(r => r.status === 'failed').length,
      totalImagesTested: testResults.reduce((sum, r) => sum + r.itemsTested, 0),
      totalImagesSuccessful: testResults.reduce((sum, r) => sum + r.itemsSuccessful, 0),
      totalImagesFailed: testResults.reduce((sum, r) => sum + r.itemsFailed, 0)
    };

    res.json({
      summary,
      detailedResults: testResults
    });

  } catch (err) {
    logger.error(`❌ Error global en testTemas:`, err.message);
    res.status(500).json({
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  }
};

module.exports = { insertMasivo, testTemas };
