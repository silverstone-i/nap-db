// ./tests/test.model.js
'use strict';

const Model = require('../db/Model');
require('dotenv').config();
const DB = require('../db/DB');
const pgp = require('pg-promise')();

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

// console.log('Connection object:', connection);

class Users extends Model {
  static #cs;
    constructor(db, pgp) {
        const schema = {
          tableName: 'users',
          timeStamps: true, // Add time stamps to table - default is true
          columns: {
            id: { type: 'serial', nullable: false }, // Serial type column
            email: { type: 'varchar(255)', primaryKey: true },
            password: { type: 'varchar(255)', nullable: false },
            role: { type: 'varchar(255)', nullable: true, default: "'admin'" },
            name: { type: 'varchar(255)', nullable: true },
            ss: { type: 'varchar(255)', nullable: true },
          },
          uniqueConstraints: {
            users_id_unique: { columns: ['id'] },
          },
        };
        super(db, pgp, schema);

        if(!Users.#cs  ){
          Users.#cs = this.createColumnSet();
          this.setColumnsets(Users.#cs);
          console.log('Column set created:', Users.#cs);
        }
    }
}

const repositories = { users: Users };

const db = DB.init(connection, repositories);
console.log('Database initialized');

const users = new Users(db, pgp);

// console.log('users._createTableQuery():', users._createTableQuery());

(async () => {
  await users.drop();
  await users.init();
})();
// users
//   .drop()
//   .then(() => {
//     return users.init();
//   })
//   .then(() => {
//     console.log('Initialization complete.');
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });

// console.log(db.users.pgp);