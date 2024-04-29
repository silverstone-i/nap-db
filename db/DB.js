// ./db/DB.js
// database class that holds the connection and pgp objects
'use strict';
const pgPromise = require('pg-promise');

const createPgp = (options) => pgPromise(options);

const createRepositoryInstance = (repository, obj) =>
  new repository(obj, DB.pgp);

class DB {
  static db;
  static pgp;

  static init(connection, repositories) {
    if (!DB.db) {
      try {
        if (connection === undefined || connection === null) {
          throw new Error('Connection parameter is required');
        }
        if (
          !repositories ||
          typeof repositories !== 'object' ||
          Array.isArray(repositories) ||
          repositories === null
        ) {
          throw new Error(
            'Repositories parameter is required and must be a plain object'
          );
        }

        const initOptions = {
          capSQL: true, // capitalize all generated SQL
          extend(obj, dc) {
            for (const [repository, repoConstructor] of Object.entries(
              repositories
            )) {
              obj[repository] = createRepositoryInstance(repoConstructor, obj);
            }
            console.log('CREATE Repositories');
          },
        };
        DB.pgp = createPgp(initOptions);
        DB.db = DB.pgp(connection);
      } catch (error) {
        console.error('Error initializing database:', error.message);
        throw new Error('Database initialization failed', { cause: error });
      }
    }

    return DB.db;
  }
}

module.exports = DB;
