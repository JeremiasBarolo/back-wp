const mysql = require('mysql');
const axios = require('axios');
require('dotenv').config(); 

class SQLService {
    constructor() {
        this.db = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        this.db.connect(err => {
            if (err) {
                console.error('Error connecting to the database:', err);
                return;
            }
            console.log('Connected to the database');
        });
    }

    async insertMasivo() {
        try {
            const response = await axios.get('https://rickandmortyapi.com/api/character');
            const characters = response.data.results;

            characters.forEach(character => {
                const title = character.name;
                const content = `<!-- wp:paragraph -->
<p>${character.status} - ${character.species}</p>
<!-- /wp:paragraph -->
<!-- wp:image -->
<figure class="wp-block-image"><img src="${character.image}" alt="${character.name}"/></figure>
<!-- /wp:image -->
<!-- wp:paragraph -->
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent non leo vestibulum, condimentum elit non, venenatis eros.</p>
<!-- /wp:paragraph -->`;

                const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const postName = title.replace(/\s+/g, '-').toLowerCase();
                const year = new Date().getFullYear();
                const month = (`0${new Date().getMonth() + 1}`).slice(-2);

                const query = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author) VALUES (?, ?, ?, ?, ?, ?, ?, "publish", "post", ?, ?, ?)';
                this.db.query(query, [title, content, '', '', '', '', 0, currentDate, postName, 1], (err, result) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        return;
                    }
                    const postId = result.insertId;
                    const postUrl = `http://localhost:10010/?p=${postId}`;
                    const updateQuery = 'UPDATE wp_posts SET guid = ? WHERE ID = ?';
                    this.db.query(updateQuery, [postUrl, postId], (err, result) => {
                        if (err) {
                            console.error('Error updating guid:', err);
                            return;
                        }
                        console.log('GUID updated:', postUrl);

                        // Insert the image as an attachment
                        const imageQuery = 'INSERT INTO wp_posts (post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered, post_parent, post_status, post_type, post_date, post_name, post_author, guid, post_mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, "inherit", "attachment", ?, ?, ?, ?, ?)';
                        const imageName = `${postName}-image`;
                        const imageGuid = `http://localhost:10010/wp-content/uploads/${year}/${month}/${postName}.jpg`; // Adjust the URL format as needed
                        const mimeType = 'image/jpeg'; // Assuming the images are JPEGs, adjust if necessary
                        this.db.query(imageQuery, [title, '', '', '', '', '', postId, currentDate, imageName, 1, imageGuid, mimeType], (err, result) => {
                            if (err) {
                                console.error('Error inserting image:', err);
                                return;
                            }
                            const imageId = result.insertId;

                            // Associate the image with the post as the featured image
                            const metaQuery = 'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, "_thumbnail_id", ?)';
                            this.db.query(metaQuery, [postId, imageId], (err, result) => {
                                if (err) {
                                    console.error('Error inserting post meta:', err);
                                    return;
                                }
                                console.log('Featured image set:', imageId);
                            });
                        });
                    });
                });
            });

            return { message: 'Data insertion initiated' };
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }
    }
}

module.exports = SQLService;