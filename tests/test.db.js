// ./tests/test.db.js
'use strict';

require('dotenv').config();
const DB = require('../db/DB');

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

console.log('Connection object:', connection);

const repositories = {};

const db = DB.init(connection, repositories);
console.log('Database initialized');

// Test the connection
db
  .connect()
  .then((obj) => {
    console.log('Connected to Postgres database!');
    obj.done(); // success, release connection;
  })
  .catch((error) => {
    console.log('Error connecting to Postgres database:', error.message);
  });

  console.log('pgp object:', db);
