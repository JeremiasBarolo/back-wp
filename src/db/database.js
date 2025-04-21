const mysql = require("mysql2");
require('dotenv').config();

let dbConfig = {
    connectionLimit: 90, 
    host: process.env.DB_HOST_AWS ,
    port: process.env.DB_PORT_AWS ,
    user: process.env.DB_USER_AWS ,
    password: process.env.DB_PASSWORD_AWS ,
    database: process.env.DB_NAME_AWS ,
};

const pool = mysql.createPool(dbConfig);
const connection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) return reject(err);

      const query = (sql, binding) => {
        return new Promise((resolve, reject) => {
          connection.query(sql, binding, (err, result) => {
            if (err) {
              return reject(err);
            }
            console.log("MySQL pool connected ✔");
            resolve(result);
            
            console.log("Query ejecutada correctamente");
          });
        });
      };

      const release = () => {
        connection.release();
        console.log("MySQL pool released ❌");
      };

      resolve({ query, release });
    });
  });
};

const query = (sql, binding) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
module.exports = { pool, connection, query };