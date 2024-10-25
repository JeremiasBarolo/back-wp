// const { Configuration, OpenAIApi } = require('openai');

// class OpenAIService {
//   constructor() {
//     this.configuration = new Configuration({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//     this.openai = new OpenAIApi(this.configuration);

//     this.prompt =` Recibes el siguiente texto de una noticia. 
//     Si puedes, enriquécelo con citas en W2.quote, párrafos <p> y otros elementos permitidos en WordPress. 
//     Si no puedes enriquecerlo, devuelve el mismo texto original pero correctamente formateado en HTML. 
//     Siempre debera de responder con un titulo, un content(Siempre el texto en formato HTML compatible con WordPress) y un array de tags creado apartir de el contenido de la noticia 
//     que permitan categorizarlo de manera correta dentro de la aplicacion.
//     Si el texto es muy corto o nulo, devuelve "El Contenido de esta noticia esta bajo revision y pronto estara disponible.".
    
   
//     Aquí está el texto:`;
//   }

//   async enriquecerTexto(text) {
//     try {
//       const response = await this.openai.createCompletion({
//         model: 'text-davinci-003',
//         prompt: `${prompt}: ${text}`,
//         max_tokens: 150,
//       });

//       return {
//         status: 'success',
//         data: response.data.choices[0].text.trim(),
//       };
//     } catch (error) {
//       return {
//         status: 'error',
//         message: error.message,
//       };
//     }
//   }
// }

// module.exports = OpenAIService;