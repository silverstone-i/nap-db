// ./db/DB.js
// database class that holds the connection and pgp objects
'use strict';
const pgPromise = require('pg-promise');
const {
  ConnectionParameterError,
  RepositoriesParameterError,
  DBError,
} = require('./errors'); // Import your custom error classes

/**
 * Initializes the database connection and creates repository instances.
 *
 * @param {Object} connection - The connection object for the database.
 * @param {Object} repositories - The repositories object containing repository constructors.
 * @returns {Object} - The initialized database object.
 * @throws {ConnectionParameterError} - If the connection parameter is undefined or null.
 * @throws {RepositoriesParameterError} - If the repositories parameter is not a plain object.
 * @throws {DBError} - If there is an error initializing the database.
 */

let counter = 0;
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
              console.log('Counter:', ++counter);
              obj[repository] = new repositories[repository](obj, DB.pgp);
            }
          },
        };
        DB.pgp = pgPromise(initOptions);
        DB.db = DB.pgp(connection);

        // Use pg-minify to minify queries globally
        DB.pgp.pg.types.setTypeParser(1114, (stringValue) => stringValue); // Ensuring date types are not parsed as dates

        // Use pg-promise query formatting to apply minification
        DB.pgp.pg.queryFormatter = {
          minify: true,
        };
      } catch (error) {
        throw error;
      }
    }

    return DB.db;
  }
}

module.exports = DB;
