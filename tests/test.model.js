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

const repositories = { users: Users };

const db = DB.init(connection, repositories);
console.log('Database initialized');

const users = new Users(db, pgp);

console.log('LOG COLUMNSET:', users.columnset);

try {
  users.init();
  console.log('Table created');
} catch (error) {
  console.error('Error creating table:', error.message);
}

const cs = users.columnset;
// console.log(cs.columns[2].skip.toString());

const insertDTO = {
  email: 'joe@gmail.com',
  password: 'donthackme',
  employee_id: 123,
  full_name: 'Joe Picket',
  role: 'admin',
  active: false,
  created_by: 'Joe Picket',
};

const insert = pgp.helpers.insert(insertDTO, cs.insert);
console.log('\nINSERT QUERY:', insert);

const updateDTO = {
  email: 'joe@gmail.com',
  password: 'donthackme',
  role: 'user',
  updated_by: 'Joe Picket',
  _condition: ' where email = ${email}',
};

const filters = { email: 'joe@gmail.com' };

let condition = pgp.as.format(updateDTO._condition, updateDTO);
const update = pgp.helpers.update(updateDTO, cs.update) + condition;
console.log('\nUPDATE QUERY:', update);

const selectDTO = {
  email: 'joe@gmail.com',
  password: 'donthackme',
  role: 'user',
  _condition: 'where email = ${email}',
};

condition = '';
if (selectDTO._condition) {
  condition = pgp.as.format(selectDTO._condition, selectDTO);
  delete selectDTO._condition;
}

console.log('Select Condition:', condition);

const select =
  Object.keys(selectDTO).length === 0 && selectDTO.constructor === Object
    ? `SELECT * FROM ${users.schema.tableName};`
    : pgp.as.format(
        `SELECT $1:name FROM ${users.schema.tableName} ${condition};`,
        [selectDTO]
      );

console.log('\nSELECT QUERY:', select);

const deleteDTO = {
  email: 'joe@gmail.com',
  _condition: 'where email = ${email}',
};

condition = '';
if (deleteDTO._condition) {
  condition = pgp.as.format(deleteDTO._condition, deleteDTO);
  delete deleteDTO._condition;
} else {
  throw new Error('Delete requires a condition');
} // end if deleteDTO._condition

const del = pgp.as.format(
  `DELETE FROM ${users.schema.tableName} ${condition};`,
  [deleteDTO]
);
console.log('\nDELETE QUERY:', del);
