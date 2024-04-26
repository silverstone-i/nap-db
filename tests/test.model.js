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

    this.createColumnSet();
  }
}

const repositories = { users: Users };

const db = DB.init(connection, repositories);
console.log('Database initialized');

const users = new Users(db, pgp);
console.log('LOG COLUMNSET:', users.columnset);

const dto = {
  columns: {
    id: 1,
    email: 'ian@test.com',
    password: 'huluhoops',
    // role: 'user',
    name: 'ian',
    ss: '000-00-0000',
  },
};

// const queryC = pgp.helpers.insert(dto.columns, users.cs);
// console.log('INSERT QUERY:', queryC);

const queryU =
  pgp.helpers.update(dto.columns, users.cs) + ' WHERE id = $1 AND email = $2';
console.log('UPDATE QUERY:', queryU);

