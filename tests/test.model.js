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

console.log('Connection object:', connection);

const repositories = {};

const db = DB.init(connection, repositories);
console.log('Database initialized');


class Users extends Model {
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
          // columns: {
          //   id: { type: 'serial', primaryKey: true },
          //   name: { type: 'varchar(255)', nullable: false },
          //   age: { type: 'int', nullable: true, default: 18 },
          //   // Add more columns as needed
          //   department_id: { type: 'int', nullable: false }, // Example foreign key column
          //   // Add more foreign key columns as needed
          //   manager_id: { type: 'int', nullable: false }, // Example additional foreign key column
          // },
          // foreignKeys: {
          //   department_id: {
          //     // Example foreign key definition for department_id
          //     referenceTable: 'departments', // Referenced table name
          //     referenceColumns: ['id'], // Referenced column(s) name in the departments table
          //     onDelete: 'CASCADE', // Cascade deletion
          //     onUpdate: 'CASCADE', // Cascade update
          //   },
          //   manager_id: {
          //     // Example foreign key definition for manager_id
          //     referenceTable: 'employees', // Referenced table name
          //     referenceColumns: ['id'], // Referenced column(s) name in the employees table
          //     onDelete: 'SET NULL', // Set manager_id to NULL on deletion of referenced employee
          //     onUpdate: 'CASCADE', // Cascade update
          //   },
          //   // Add more foreign keys as needed
          // },
          // uniqueConstraints: {
          //   test_table_name_age_unique: { columns: ['name', 'age'] }, // Example unique constraint for name column
          //   // Add more unique constraints as needed
          // },
        };
        super(db, pgp, schema);
    }
}

const users = new Users(db, db.pgp);

console.log('users._createTableQuery():', users._createTableQuery());

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