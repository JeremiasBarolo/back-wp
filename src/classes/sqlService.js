const mysql = require('mysql');
const axios = require('axios');
require('dotenv').config(); 
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mkdirp = require('mkdirp');


class SQLService {
    constructor(user, password, database, host, port) {
        this.db = mysql.createConnection({
            host: host || process.env.DB_HOST,
            user: user || process.env.DB_USER,
            password: password || process.env.DB_PASSWORD,
            database: database || process.env.DB_NAME,
            port: port || process.env.DB_PORT,
        });

        this.db.connect(err => {
            if (err) {
                console.error('Error connecting to the database:', err);
                return;
            }
            console.log('Connected to the database successfully');
        });

        this.insertAtachmentQuery = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author, guid, post_mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, "inherit", "attachment", ?, ?, ?, ?, ?)';
        this.metaQuery = `INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, '_wp_attachment_metadata', ?)`;
        this.insertPostQuery = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author) VALUES (?, ?, ?, ?, ?, ?, ?, "publish", "post", ?, ?, 1)';
        this.connectionImageQuery = `INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, '_wp_attached_file', ?)`;
        this.featuredImageQuery = `INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, '_thumbnail_id', ?)`;

    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            this.db.query('SELECT 1 + 1 AS solution', (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }


    async insertMasivo() {
            try {
                const response = await axios.get('https://rickandmortyapi.com/api/character');
                const characters = response.data.results
                for(const character of characters) {
                    await this.insertNota(character)
                    .then(async data =>{
                        
                        if (data) {
                            const idPost = data.postId;
                            const imageUrl = data.imageUrl;
                            const imagePath = data.imagePath;
                            const postName = data.postName;
                    
                            await this.insertAttachment(idPost, imageUrl, imagePath, postName);
                            await this.setCategoria(idPost, 1);
                        } else {
                            console.error('Error: insertNota no retornó datos válidos');
                        }}
                    );

                }
              
            
                
            } catch (error) {
                console.error('Error fetching characters:', error);
            }
    }


    async downloadImage( imageUrl, imagePath) {
            const writer = fs.createWriteStream(imagePath);
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 10000, 
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
    };

       
    async insertAttachment(postId, imageUrl, originalImagePath, postName) {
            const title = 'Attachment title';
            const content = 'Attachment content';
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const year = new Date().getFullYear();
            const month = (`0${new Date().getMonth() + 1}`).slice(-2);
        
            const sizes = [
                { width: 150, height: 150 },
                { width: 200, height: 165 },
                { width: 300, height: 200 },
                { width: 554, height: 346 },
                { width: 554, height: 369 },
                { width: 768, height: 512 },
                { width: 1024, height: 683 },
                { width: 1140, height: 640 }
            ];
        
            const uploadDir = path.join(`C:/Users/Matias/Local Sites/prueba-del-famoso-tomi/app/public/wp-content/uploads/${year}/${month}`);
            mkdirp.sync(uploadDir);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        
            // Obtener la extensión de la URL de la imagen
            const extension = path.extname(imageUrl).split('.').pop(); 

            const originalGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${postName}.${extension}`;
            const relativeImagePath = `${year}/${month}/${postName}.${extension}`;
        
            // Descargar imagen original
            await this.downloadImage(imageUrl, originalImagePath);
        
            // Insertar imagen original en la base de datos
            const originalPostQuery = this.insertAtachmentQuery;
            this.db.query(originalPostQuery, ['', '', '', '', '', '', postId, currentDate, postName, 1, originalGuid, `image/${extension}`], async (err, result) => {
                if (err) {
                    console.error('Error inserting original attachment:', err);
                    return;
                }
        
                const attachmentId = result.insertId;
                console.log('Original attachment inserted successfully:', result);
        
                const metadata = { sizes: {} };
        
                const extension = path.extname(originalImagePath); 
                const baseName = path.basename(originalImagePath, extension); 
                const uploadDir = path.dirname(originalImagePath); 

                for (const dimensions of sizes) {
                    const sizeName = `${dimensions.width}x${dimensions.height}`;
                    const resizedImagePath = path.join(uploadDir, `${baseName}-${sizeName}${extension}`); 
                    const sizeGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${baseName}-${sizeName}${extension}`;
                    console.log('EXTENSION', extension);
                    
                    try {
                        await sharp(originalImagePath)
                            .resize(dimensions.width, dimensions.height)
                            .toFormat('jpg')
                            .toFile(resizedImagePath); 

                        metadata.sizes[sizeName] = {
                            file: `${baseName}-${sizeName}${extension}`,
                            width: dimensions.width,
                            height: dimensions.height,
                            mime_type: `image/${extension.replace('.', '')}`
                        };

                        const sizePostQuery = this.insertAtachmentQuery;
                        this.db.query(sizePostQuery, ['', '', '', '', '', '', attachmentId, currentDate, `${postName}-${sizeName}`, 1, sizeGuid, `image/${extension}`], (err, result) => {
                            if (err) {
                                console.error(`Error inserting ${sizeName} attachment:`, err);
                                return;
                            }
                            console.log(`${sizeName} attachment inserted successfully:`, result);
                        });

                    } catch (error) {
                        console.error(`Error processing ${sizeName} image:`, error);
                    }
                }
        
                // Insertar metadatos en wp_postmeta
                
                const metadataWithFile = {
                    file: relativeImagePath,
                    sizes: metadata.sizes,
                    image_meta: {
                        aperture: "0",
                        credit: "",
                        camera: "",
                        caption: "",
                        created_timestamp: "0",
                        copyright: "",
                        focal_length: "0",
                        iso: "0",
                        shutter_speed: "0",
                        title: "",
                        orientation: "0",
                        keywords: []
                    }
                };
        
                this.db.query(this.metaQuery, [attachmentId, JSON.stringify(metadataWithFile)], (err) => {
                    if (err) {
                        console.error('Error inserting metadata for attachment:', err);
                    } else {
                        console.log('Metadata for attachment inserted successfully.');
                    }
                });
        
                // Asignar la imagen como portada del post
                
                this.db.query(this.featuredImageQuery, [postId, attachmentId], (err) => {
                    if (err) {
                        console.error('Error setting featured image:', err);
                    } else {
                        console.log('Featured image set successfully.');
                    }
                });
        
                // Insertar el `_wp_attached_file` con la ruta relativa
                
                this.db.query(this.connectionImageQuery, [attachmentId, relativeImagePath], (err) => {
                    if (err) {
                        console.error('Error inserting _wp_attached_file:', err);
                    } else {
                        console.log('_wp_attached_file inserted successfully.');
                    }
                });
            });
    }
    
    
    

    async insertNota(character) {
            const title = character.name;
            const content = `
                <!-- wp:paragraph -->
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent non leo vestibulum, condimentum elit non, venenatis eros.</p>
                <!-- /wp:paragraph -->`;

            const excert = `${character.status} - ${character.species}`;    
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const postName = title.replace(/\s+/g, '-').toLowerCase();
            const year = new Date().getFullYear();
            const month = (`0${new Date().getMonth() + 1}`).slice(-2);
        
            return new Promise((resolve, reject) => {
                const query = this.insertPostQuery;
                
                // Inserta la publicación en la base de datos
                this.db.query(query, [title, content, excert, '', '', '', 0, currentDate, postName, 1], async (err, result) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        reject(err);
                        return;
                    }
                    const postId = result.insertId;
                    const postUrl = `http://localhost:10010/?p=${postId}`;
                    const updateQuery = 'UPDATE wp_posts SET guid = ? WHERE ID = ?';
                    
                    // Actualiza la URL de la publicación
                    this.db.query(updateQuery, [postUrl, postId], async (err) => {
                        if (err) {
                            console.error('Error updating guid:', err);
                            reject(err);
                            return;
                        }
                        console.log('GUID updated:', postUrl);
                        
        
                        const imageUrl = character.image;
                        const extension = path.extname(imageUrl).split('.').pop()
                        const imagePath = path.join(`C:/Users/Matias/Local Sites/prueba-del-famoso-tomi/app/public/wp-content/uploads/${year}/${month}/`, `${postName}.${extension}`);
                        
                        // Descarga y guarda la imagen
                        await this.downloadImage(imageUrl, imagePath);
                        console.log('Image downloaded successfully:', imagePath);
                        
                        // Resuelve la promesa con los datos necesarios
                        resolve({ postId, imageUrl, imagePath, postName });
                    });
                });
            });
    }
        
    async createCategoria(categoryName,) {
        const termInsertQuery = 'INSERT INTO wp_terms (name, slug) VALUES (?, ?)';
        this.db.query(termInsertQuery, [categoryName, categoryName.toLowerCase().replace(/\s+/g, '-')], (err, result) => {
            if (err) {
                console.error('Error inserting term:', err);
                return;
            }
            const termId = result.insertId; // Obtener el ID del término insertado

            // 2. Insertar la taxonomía en wp_term_taxonomy
            const taxonomyInsertQuery = 'INSERT INTO wp_term_taxonomy (term_id, taxonomy) VALUES (?, ?)';
            this.db.query(taxonomyInsertQuery, [termId, 'category'], (err, result) => {
                if (err) {
                    console.error('Error inserting term taxonomy:', err);
                    return;
                }
                const termTaxonomyId = result.insertId; // Obtener el ID de la taxonomía

               
            });
        });
    } 

    async setCategoria(postId, categoriaId) {
         const relationshipInsertQuery = 'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)';
         this.db.query(relationshipInsertQuery, [postId, categoriaId], (err, result) => {
             if (err) {
                 console.error('Error inserting term relationship:', err);
                 return;
             }
             console.log('Post associated with category successfully');
         });
           
    }


}

module.exports = SQLService;