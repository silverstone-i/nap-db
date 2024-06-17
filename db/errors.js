'use strict';

/**
 * Custom errors for the db module
 * @class DBError
 * @extends Error
 * 
 * @constructor
 * @param {string} message - The error message
 * @param {Error} [cause] - The cause of the error
 */
class DBError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DBError';
    this.cause = cause;

    // Ensure the correct prototype chain
    // Object.setPrototypeOf(this, DBError.prototype);

    // Capture the stack trace
    // if (Error.captureStackTrace) {
    //   console.log('Capturing stack trace');
    //   Error.captureStackTrace(this, DBError);
    //   console.log('Stack trace captured', this.stack);

    // }
  }
}
 
/**
 * Error thrown when connection parameter is missing
 * @class ConnectionParameterError
 * @extends DBError
 */
class ConnectionParameterError extends DBError {
  constructor() {
    super('Connection parameter is required');
    this.name = 'ConnectionParameterError';
  }
}

/**
 * Error thrown when repositories parameter is missing or invalid
 * @class RepositoriesParameterError
 * @extends DBError
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
  RepositoriesParameterError,
};
