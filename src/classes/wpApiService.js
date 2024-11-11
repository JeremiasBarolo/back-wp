const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const sharp = require('sharp');

class WpApiService {

    constructor(siteurl, username, password) {
        this.siteurl = siteurl;
        this.username = username;
        this.password = password;
    }


   
    async getJWTToken(siteurl, username, password){
        try {
            

            const response = await axios.post(`${siteurl}wp-json/jwt-auth/v1/token?username=${username}&password=${password}`);
            const token = response.data.token;
            return token;
        } catch (error) {
            console.error('Error al obtener el token:', error);
            throw error;
        }
    }

    async uploadImageFromURL(imageUrl, token, tituloImagen, altText) {
        try {
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
            // Redimensionar la imagen con Sharp
            const resizedImage = await sharp(imageResponse.data)
                .resize(1024, 640)
                .jpeg({ quality: 100 })
                .toBuffer();
    
            // Crear el formulario de datos
            const formData = new FormData();
            formData.append('file', resizedImage, {
                filename: tituloImagen,
                contentType: 'image/jpeg',  // Asegúrate de especificar el tipo correcto
            });
            formData.append('title', tituloImagen);
            formData.append('alt_text', altText);
    
            // Configuración de los encabezados de la solicitud
            const headers = {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()  // Los headers adecuados para FormData
            };
    
            // Hacer la solicitud POST
            const uploadResponse = await axios.post(
                `${this.siteurl}/wp-json/wp/v2/media`, 
                formData,
                { headers }
            );
    
            
            return uploadResponse.data.id;
        } catch (error) {
            console.error('Error al subir la imagen:', error.response?.data);
            throw error;
        }
    }



    async createPostWithImage(title, content, excerpt, imagePath, token) {
        try {
           
            const imageId = await this.uploadImageFromURL(imagePath, token, title, title, token);
    
            
            const response = await axios.post(
                `${this.siteurl}wp-json/wp/v2/posts`,
                {
                    title,
                    content,
                    status: 'publish',
                    featured_media: imageId,
                    categories: [1],
                    template: 'templates/post-full-width.php',
                    excerpt: excerpt,

                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
    
            return response.data;
        } catch (error) {
            console.error('Error al crear el post con imagen:', error.response?.data);
            throw error;
        }
    }


    async insertMasivo() {
        try {
            const response = await axios.get('https://rickandmortyapi.com/api/character');
            const posts = response.data.results
            // const post = posts[0];
            let excerpt = `Lorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elitLorem ipsum dolor sit amet, consectetur adipiscing elit`
            
            for(const post of posts) {
                let token = await this.getJWTToken(this.siteurl, this.username, this.password);
                this.createPostWithImage(post.name, post.status, excerpt, post.image, token)
                

            }
          
        
            
        } catch (error) {
            console.error('Error fetching characters:', error);
        }
}


    

}


// const wpApiService = new WpApiService();

module.exports = WpApiService;
