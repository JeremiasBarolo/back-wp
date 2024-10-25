const mysql = require('mysql');
const axios = require('axios');
require('dotenv').config(); 
const fs = require('fs');
const path = require('path');


class SQLService {
    constructor(user, password, database, host, port) {
        this.db = mysql.createConnection({
            host: host || process.env.DB_HOST_AWS,
            user: user || process.env.DB_USER_AWS,
            password: password || process.env.DB_PASSWORD_AWS,
            database: database || process.env.DB_NAME_AWS,
            port: port || process.env.DB_PORT_AWS,
        });

        this.db.connect(err => {
            if (err) {
                console.error('Error connecting to the database:', err);
                return;
            }
            console.log('Connected to the database successfully');
        });
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
            // try {
            //     const response = await axios.get('https://rickandmortyapi.com/api/character');
            //     const characters = response.data.results;

            //     for (const character of characters) {
            //         const title = character.name;
            //         const content = `
            //             <!-- wp:paragraph -->
            //             <p>${character.status} - ${character.species}</p>
            //             <!-- /wp:paragraph -->
            //             <!-- wp:paragraph -->
            //             <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent non leo vestibulum, condimentum elit non, venenatis eros.</p>
            //             <!-- /wp:paragraph -->`;

            //         const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            //         const postName = title.replace(/\s+/g, '-').toLowerCase();
            //         const year = new Date().getFullYear();
            //         const month = (`0${new Date().getMonth() + 1}`).slice(-2);

            //         // Insert the post into WordPress
            //         const query = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author) VALUES (?, ?, ?, ?, ?, ?, ?, "publish", "post", ?, ?, ?)';
            //         this.db.query(query, [title, content, '', '', '', '', 0, currentDate, postName, 1], async (err, result) => {
            //             if (err) {
            //                 console.error('Error inserting data:', err);
            //                 return;
            //             }
            //             const postId = result.insertId;
            //             const postUrl = `http://localhost:10010/?p=${postId}`;
            //             const updateQuery = 'UPDATE wp_posts SET guid = ? WHERE ID = ?';
            //             this.db.query(updateQuery, [postUrl, postId], (err, result) => {
            //                 if (err) {
            //                     console.error('Error updating guid:', err);
            //                     return;
            //                 }
            //                 console.log('GUID updated:', postUrl);
            //             });

            //             // Step 1: Download the image from the character's URL
            //             const imageUrl = character.image; // Character's image URL
            //             const imagePath = path.join(`C:/Users/Matias/Local Sites/prueba-del-famoso-tomi/app/public/wp-content/uploads/${year}/${month}/`, `${postName}.jpg`); // Path to store the image
            //             // Step 2: Download and save the image
                        
            //             try {
            //                 await this.downloadImage(imageUrl, imagePath); 
            //                 console.log('Image downloaded successfully:', imagePath);

            //                 // Step 3: Insert the image as an attachment in WordPress
            //                 const imageQuery = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author, guid, post_mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, "inherit", "attachment", ?, ?, ?, ?, ?)';
            //                 const imageName = `${postName}-image`;
            //                 const imageGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${postName}.jpg`;
            //                 const mimeType = 'image/jpeg'; // Adjust this as necessary
            //                 this.db.query(imageQuery, [title, '', '', '', '', '', postId, currentDate, imageName, 1, imageGuid, mimeType], (err, result) => {
            //                     if (err) {
            //                         console.error('Error inserting image:', err);
            //                         return;
            //                     }
            //                     const imageId = result.insertId;

            //                     // Step 4: Set the image as the featured image for the post
            //                     const metaQuery = 'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, "_thumbnail_id", ?)';
            //                     this.db.query(metaQuery, [postId, imageId], (err, result) => {
            //                         if (err) {
            //                             console.error('Error inserting post meta:', err);
            //                             return;
            //                         }
            //                         console.log('Featured image set:', imageId);
            //                     });
            //                 });
            //             } catch (error) {
            //                 console.error('Error downloading or saving image:', error);
            //             }
            //         });
            //     }
            // } catch (error) {
            //     console.error('Error fetching characters:', error);
            // }
        }


        async downloadImage( imageUrl, imagePath) {
            const writer = fs.createWriteStream(imagePath);
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream',
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        };

}

module.exports = SQLService;