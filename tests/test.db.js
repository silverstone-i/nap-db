// ./tests/test.db.js
'use strict';

require('dotenv').config();
const DB = require('../db/DB');
const Model = require('../db/Model');

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

console.log('Connection object:', connection);

class Users extends Model {
  constructor(db, pgp) {
    const schema = {
      tableName: 'users',
      dbSchema: 'public',
      timeStamps: true, // Add time stamps to table - default is true
      columns: {
        email: { type: 'varchar(255)', primaryKey: true },
        password: { type: 'varchar(255)', nullable: false },
        employee_id: { type: 'int4', nullable: false },
        full_name: { type: 'varchar(50)', nullable: false },
        role: { type: 'varchar(25)', nullable: false, default: 'user' },
        active: { type: 'bool', nullable: false, default: true },
      },
    };
    super(db, pgp, schema);

    this.createColumnSet();
  }
}


const repositories = { user: Users};

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
