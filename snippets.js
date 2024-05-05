'use strict';

const Model = require('./db/Model');
const pgp = require('pg-promise')();

const schema = {
  tableName: 'test_table',
  dbSchema: 'public',
  columns: {
    id: { primaryKey: true, type: 'integer' },
    name: { type: 'text', default: 'unknown' },
  },
};

const model = new Model({}, pgp, schema);
model.createColumnSet();

console.log('COLUMN SET', model.cs);
