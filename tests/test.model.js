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
        role: { type: 'varchar(25)', nullable: false, default: 'user'},
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
 _condition: 'WHERE email = ${email};',
};

const update =
  pgp.helpers.update(updateDTO, cs.update) +
  ' WHERE id = $1 AND email = $2';
console.log('\nUPDATE QUERY:', update);
