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


    async downloadImage(imageUrl, imagePath) {
        // Crea el directorio antes de intentar guardar la imagen
        const dir = path.dirname(imagePath);
        mkdirp.sync(dir);
    
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


    async insertAttachment(postId, imageUrl, originalImagePath, postName) {
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const year = new Date().getFullYear();
        const month = (`0${new Date().getMonth() + 1}`).slice(-2);
        
        const sizes = [
            { width: 150, height: 150, name: 'thumbnail' },
            { width: 200, height: 165, name: 'buzzmag_small' },
            { width: 300, height: 300, name: 'medium' },
            { width: 554, height: 346, name: 'buzzmag_medium' },
            { width: 554, height: 554, name: 'buzzmag_masonry' },
            { width: 768, height: 768, name: 'medium_large' },
            { width: 1024, height: 640, name: 'buzzmag_large' }
        ];
        
        const uploadDir = path.join(`C:/Users/Matias/Local Sites/prueba-del-famoso-tomi/app/public/wp-content/uploads/${year}/${month}`);
        mkdirp.sync(uploadDir);
        
        const extension = path.extname(imageUrl).split('.').pop();
        const originalGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${postName}.${extension}`;
        const relativeImagePath = `${year}/${month}/${postName}.${extension}`;
    
        await this.downloadImage(imageUrl, originalImagePath);
    
        const originalPostQuery = this.insertAtachmentQuery;
        this.db.query(originalPostQuery, ['', '', '', '', '', '', postId, currentDate, postName, 1, originalGuid, `image/${extension}`], async (err, result) => {
            if (err) {
                console.error('Error inserting original attachment:', err);
                return;
            }
    
            const attachmentId = result.insertId;
            const metadata = { sizes: {} };
            const baseName = path.basename(originalImagePath, extension);
            
            for (const { width, height, name } of sizes) {
                const sizeImagePath = path.join(uploadDir, `${baseName}-${width}x${height}.${extension}`);
                const sizeGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${baseName}-${width}x${height}.${extension}`;
                
                try {
                    await sharp(originalImagePath)
                        .resize(width, height)
                        .toFile(sizeImagePath);
    
                    metadata.sizes[name] = {
                        file: `${baseName}-${width}x${height}.${extension}`,
                        width: width,
                        height: height,
                        mime_type: `image/${extension}`
                    };
    
                    const sizePostQuery = this.insertAtachmentQuery;
                    this.db.query(sizePostQuery, ['', '', '', '', '', '', attachmentId, currentDate, `${postName}-${width}x${height}`, 1, sizeGuid, `image/${extension}`], (err) => {
                        if (err) console.error(`Error inserting ${name} attachment:`, err);
                    });
                } catch (error) {
                    console.error(`Error processing ${name} image:`, error);
                }
            }
    
            const metadataWithFile = {
                width: 1024,
                height: 1024,
                file: relativeImagePath,
                filesize: fs.statSync(originalImagePath).size,
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
    
            const serializedMeta = await this.serializeMeta(metadataWithFile);
    
            // Inserción de `_wp_attachment_metadata`
            const insertMetadataQuery = `INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, '_wp_attachment_metadata', ?)`;
            if (serializedMeta) {
                this.db.query(insertMetadataQuery, [attachmentId, serializedMeta], (err) => {
                    if (err) {
                        console.error('Error inserting serialized metadata:', err);
                    } else {
                        console.log('Serialized metadata inserted successfully.');
                    }
                });
            } else {
                console.error('Error: Serialized metadata is empty or invalid.');
            }
    
            // Asignación de la imagen como portada del post
            this.db.query(this.featuredImageQuery, [postId, attachmentId], (err) => {
                if (err) {
                    console.error('Error setting featured image:', err);
                } else {
                    console.log('Featured image set successfully.');
                }
            });
    
            // Inserción de `_wp_attached_file`
            this.db.query(this.connectionImageQuery, [attachmentId, relativeImagePath], (err) => {
                if (err) {
                    console.error('Error inserting _wp_attached_file:', err);
                } else {
                    console.log('_wp_attached_file inserted successfully.');
                }
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

    async serializeMeta(metaObject) {
        const serialize = (obj) => {
            if (typeof obj === 'number') {
                return `i:${obj};`;
            } else if (typeof obj === 'string') {
                return `s:${obj.length}:"${obj}";`;
            } else if (Array.isArray(obj)) {
                let serialized = `a:${obj.length}:{`;
                obj.forEach((value, index) => {
                    serialized += `${serialize(index)}${serialize(value)}`;
                });
                serialized += '}';
                return serialized;
            } else if (typeof obj === 'object' && obj !== null) {
                const entries = Object.entries(obj);
                let serialized = `a:${entries.length}:{`;
                for (const [key, value] of entries) {
                    serialized += `${serialize(key)}${serialize(value)}`;
                }
                serialized += '}';
                return serialized;
            } else {
                return 'N;';
            }
        };
        return serialize(metaObject);
    };


}


// Clase base para el servicio de base de datos
const sqlService = new SQLService();

module.exports = {sqlService};