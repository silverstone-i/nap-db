// db.js
// database class that holds the connection and pgp objects
'use strict';

/**
 * @class DB
 * @classdesc Represents a pg_promise {@link https://vitaly-t.github.io/pg-promise/Database.html Database} connection.
 */
class DB {
  /**
   *
   * @member {DB} DB.db - Instance of pg-promise {@link https://vitaly-t.github.io/pg-promise/Database.html Database}
   */
  static db;

  /**
   *
   * @member {Object} DB.pgp - {@link https://vitaly-t.github.io/pg-promise/module-pg-promise.html pg-promise} instance
   */

  static pgp;

  /**
     * static function used for one time intialization of DB
     * @param {string|Object} connection - Database connection - see {@link https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax Connection Syntax} 
     * @param {Object} repositories - List of derived classes
     * @returns {DB.db} - Fully initialized pg-promise database object with capSQL = true
     * @example
     * 
     * const express = require('express');
     * const config = require('config');
     * const DB = require('./db/db');
     * const Users = require('./Users');
     *
     * const app = express();
     *
     * // Body Parser
     * app.use(express.urlencoded({ extended: false }));
     * app.use(express.json());

     * // repositories in the databa
     * const repositories = {
     *     users: Users,
     * }

     * const connection = config.get('connection');
     * const { db } = DB.init(connection, repositories);

     * //Test the connection
     * db.connect()
     *     .then((obj) => {
     *         console.log('Connected to Postgres database!');
     *         obj.done(); // success, release connection;
     *     })
     *     .catch((error) => {
     *         console.log('Error connecting to Postgres database:', error.message);
     *     });
     *
     *  where 
     * 
     *  connection = {
     *      "connection": {
     *      "user": "your user name",
     *      "password": "your password",
     *      "database": "database name",
     *      "host": "localhost",
     *      "port": 5432
     *      }
     *  }
     */
  static init(connection, repositories) {
    if (!DB.db) {
      const pgPromise = require('pg-promise');
      const { Diagnostics } = require('./diagnostics'); // optional diagnostic

      const initOptions = {
        capSQL: true, // capitalize all generated SQL
        // Extending the database protocol with our custom repositories;
        // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
        extend(obj, dc) {
          // Database Context (dc) is mainly useful when extending multiple databases with different access API-s.
          // Do not use 'require()' here, because this event occurs for every task and transaction being executed,
          // which should be as fast as possible.
          // for(const repository of Object.keys(repositories)) {
          //     obj.repository = new repositories[repository](obj, pgp);
          // }
          // Check if the pgp object is valid
          for (const repository of Object.keys(repositories)) {
            obj[repository] = new repositories[repository](obj, DB.pgp);
          }
        },
      };

      // Initializing the library:
      DB.pgp = pgPromise(initOptions);

      // Creating the database instance:
      DB.db = DB.pgp(connection);

      // Initializing optional diagnostics:
      //   Diagnostics.init(initOptions);
    }

    return DB.db;
  }
}

module.exports = DB;
