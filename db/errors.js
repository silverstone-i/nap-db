'use strict';

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

module.exports = {
  DBError,
  ConnectionParameterError,
  RepositoriesParameterError
};
