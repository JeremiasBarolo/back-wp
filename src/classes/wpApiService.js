const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const database = require('../db/database');

class WpApiService {
    constructor(siteurl, username, password) {
        this.siteurl = siteurl;
        this.username = 'admin';
        this.password = 'Perrohugo8332';
    }

    async getJWTToken() {
        try {
            const response = await axios.post(`${this.siteurl}/wp-json/jwt-auth/v1/token`, {
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

    async createPostWithImage(postData, token, tema) {
        try {
            const {
                Titular, Cuerpo, Bajada, Imagen, Tags, "Fecha Original": FechaOriginal, Autor, id
            } = postData;

            const { query, release } = await database.connection();

        
            
            const imageId = await this.uploadImageFromURL(Imagen, token, Titular);

            
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

            if(response){
                await query(`INSERT INTO posts (id_post, categoria) VALUES (?, ?)`, [postData.id, tema])

            }

            console.log(`Post creado con éxito: ${response.data.id} en ${tema}`);

            release()

            return response.data;
        } catch (error) {
            console.error('Error al crear el post con imagen:', error.response?.data || error.message);
            throw error;
        }
    }

    async insertMasivo(tema) {
        try {
            const temaEncoded = encodeURIComponent(tema);

            const response = await axios.get(`http://200.111.128.26:50888/datos?Tema=${temaEncoded}`);
            const posts = response.data; 
    
            
            const idsPosts = posts.map(post => post.id);
    
            
            const existingPosts = await this.getExistingPosts(idsPosts);
    
            
            const newPosts = posts.filter(post => !existingPosts.includes(post.id));
    
            if (newPosts.length === 0) {
                console.log('No hay posts nuevos para insertar.');
                return;
            }
    
            const token = await this.getJWTToken();

            let counter = 0;

            for (const post of newPosts) {
                try {
                    await this.createPostWithImage(post, token, tema);
                    counter++; // Incrementamos correctamente el contador
                    console.log(`Post número ${counter} de ${newPosts.length}`);
                    
                } catch (postError) {
                    console.error(`Error procesando post "${post.Titular}":`, postError.message);
                }
            }

    
            console.log(`Proceso masivo completado. Se insertaron ${newPosts.length} nuevos posts.`);
            return true
    
        } catch (error) {
            console.error('Error en el proceso masivo:', error.message);
        }
    }



    async createPostWithImageRAM(postData, token) {
        try {
            const {name, species, status, gender, image} = postData;

            

            
            const imageId = await this.uploadImageFromURL(image, token, name);

            
            // const tagIds = [];
            // for (const tag of ) {
            //     const tagId = await this.createOrGetTagId(tag, token);
            //     tagIds.push(tagId);
            // }

            
            const response = await axios.post(
                `${this.siteurl}/wp-json/wp/v2/posts`,
                {
                    title: name,
                    content: `<p>
                    loremp ipsum dolor sit amet, consectetur adipiscing elit ${name} ${species} ${status} 
                    loremp ipsum dolor sit amet, consectetur adipiscing elit ${name} ${species} ${status} 
                    loremp ipsum dolor sit amet, consectetur adipiscing elit ${name} ${species} ${status} 
                    </p><p><em>Autor: ${name}</em></p>`,

                    excerpt: `
                    loremp ipsum dolor sit amet, consectetur adipiscing elit ${name} ${species} ${status} 
                     `, 
                    status: 'publish',
                    featured_media: imageId,
                    date: new Date(),
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


    async getExistingPosts(ids) {
        const { query, release } = await database.connection();
        try {
            const result = await query('SELECT id_post FROM posts WHERE id_post IN (?)', [ids]);
            return result.map(row => row.id_post); 
        } catch (error) {
            console.error('Error consultando posts existentes:', error.message);
            return [];
        }
    }
}

module.exports = WpApiService;
