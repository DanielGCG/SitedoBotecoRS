const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.mysql_host,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
};

module.exports = dbConfig;
