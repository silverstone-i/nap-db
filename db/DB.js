// ./db/DB.js
// database class that holds the connection and pgp objects
'use strict';
const pgPromise = require('pg-promise');

const createPgp = (options) => pgPromise(options);

const createRepositoryInstance = (repository, obj) =>
  new repository(obj, DB.pgp);

/**
 * Represents an error that occurs in the database.
 * 
 * @class
 * @extends Error
 * @name DBError
 * 
 * @param {string} message - The error message.
 * @param {Error} cause - The cause of the error.
 */
class DBError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DBError';
    this.cause = cause;
  }
}

/**
 * Represents an error that occurs when a connection parameter is missing or invalid.
 *
 * @class ConnectionParameterError
 * @extends {DBError}
 */
class ConnectionParameterError extends DBError {
  constructor() {
    super('Connection parameter is required');
    this.name = 'ConnectionParameterError';
  }
}

/**
 * Represents an error that occurs when the 'repositories' parameter is missing or not a plain object.
 * 
 * @class RepositoriesParameterError
 * @extends {DBError}
 */
class RepositoriesParameterError extends DBError {
  constructor() {
    super('Repositories parameter is required and must be a plain object');
    this.name = 'RepositoriesParameterError';
  }
}

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
            Object.entries(repositories).forEach(
              ([repository, repoConstructor]) => {
                obj[repository] = createRepositoryInstance(
                  repoConstructor,
                  obj
                );
              }
            );
            console.log('CREATE Repositories');
          },
        };
        DB.pgp = createPgp(initOptions);
        DB.db = DB.pgp(connection);
      } catch (error) {
        console.error('Error initializing database:', error.message);
        const newError = new DBError('Database initialization failed');
        newError.stack = error.stack;
        throw newError;
      }
    }

    return DB.db;
  }
}

module.exports = DB;
