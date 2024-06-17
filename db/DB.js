'./db/DB.js';

/*
 * Copyright (c) 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

// ./db/DB.js
// database class that holds the connection and pgp objects
'use strict';
const pgPromise = require('pg-promise');
const {
  ConnectionParameterError,
  RepositoriesParameterError,
} = require('./errors'); // Import your custom error classes

class DB {
  static db;
  static pgp;

  static init(connection, repositories) {
    if (!DB.db) {
      try {
        if (connection === undefined || connection === null) {
          throw new ConnectionParameterError();
        }

        if (
          !repositories ||
          typeof repositories !== 'object' ||
          Array.isArray(repositories) ||
          repositories === null
        ) {
          throw new RepositoriesParameterError();
        }

        const initOptions = {
          capSQL: true, // capitalize all generated SQL
          extend(obj, dc) {
            for (const repository of Object.keys(repositories)) {
              // console.log('Counter:', ++counter);
              obj[repository] = new repositories[repository](obj, DB.pgp);
            }
          },
        };
        DB.pgp = pgPromise(initOptions);
        DB.db = DB.pgp(connection);
      } catch (error) {
        throw error;
      }
    }

    return DB.db;
  }
}

module.exports = DB;
