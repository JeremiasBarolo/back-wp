const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

class WpApiService {
    constructor(siteurl, username, password) {
        this.siteurl = siteurl;
        this.username = username;
        this.password = password;
    }

    async getJWTToken() {
        try {
            const response = await axios.post(`${this.siteurl}wp-json/jwt-auth/v1/token`, {
                username: this.username,
                password: this.password
            });
            return response.data.token;
        } catch (error) {
            console.error('Error al obtener el token:', error.response?.data || error.message);
            throw error;
        }
    }

    async uploadImageFromURL(imageUrl, token, tituloImagen) {
        try {
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const resizedImage = await sharp(imageResponse.data)
                .resize(1024, 640)
                .jpeg({ quality: 100 })
                .toBuffer();

            const formData = new FormData();
            formData.append('file', resizedImage, { filename: tituloImagen, contentType: 'image/jpeg' });
            formData.append('title', tituloImagen);

            const headers = {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            };

            const uploadResponse = await axios.post(
                `${this.siteurl}/wp-json/wp/v2/media`,
                formData,
                { headers }
            );
            return uploadResponse.data.id; 
        } catch (error) {
            console.error('Error al subir la imagen:', error.response?.data || error.message);
            throw error;
        }
    }

    async createOrGetTagId(tagName, token) {
        try {
            // Verificar si el tag ya existe
            const existingTags = await axios.get(`${this.siteurl}/wp-json/wp/v2/tags`, {
                params: { search: tagName },
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (existingTags.data.length > 0) {
                // Si el tag existe, devolver su ID
                return existingTags.data[0].id;
            } else {
                // Si el tag no existe, crearlo
                const newTagResponse = await axios.post(`${this.siteurl}/wp-json/wp/v2/tags`, {
                    name: tagName
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return newTagResponse.data.id;
            }
        } catch (error) {
            console.error(`Error creando/verificando el tag "${tagName}":`, error.response?.data);
            throw error;
        }
    }

    async createPostWithImage(postData, token) {
        try {
            const {
                Titular, Cuerpo, Bajada, Imagen, Tags, "Fecha Original": FechaOriginal, Autor
            } = postData;

            
            const imageId = await this.uploadImageFromURL(Imagen, token, Titular);

            // Crear o verificar tags y obtener sus IDs
            const tagIds = [];
            for (const tag of Tags) {
                const tagId = await this.createOrGetTagId(tag, token);
                tagIds.push(tagId);
            }

            
            const response = await axios.post(
                `${this.siteurl}/wp-json/wp/v2/posts`,
                {
                    title: Titular,
                    content: `<p>${Cuerpo}</p><p><em>Autor: ${Autor}</em></p>`,
                    excerpt: Bajada,
                    status: 'publish',
                    featured_media: imageId,
                    tags: tagIds , // Convierte los tags a string
                    date: FechaOriginal,
                    categories: [1], // Ajusta la categoría si es necesario
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log(`Post creado con éxito: ${response.data.id}`);
            return response.data;
        } catch (error) {
            console.error('Error al crear el post con imagen:', error.response?.data || error.message);
            throw error;
        }
    }

    async insertMasivo() {
        try {
            const response = await axios.get('http://200.111.128.26:50888/datos');
            const posts = response.data
            // const post = response.data[0]
            const token = await this.getJWTToken();

            for (const post of posts) {
                try {
                    await this.createPostWithImage(post, token);
                } catch (postError) {
                    console.error(`Error procesando post "${post.Titular}":`, postError.message);
                }
            }

            console.log('Proceso masivo completado.');
        } catch (error) {
            console.error('Error en el proceso masivo:', error.message);
        }
    }
}

module.exports = WpApiService;
