'use strict';

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
 
class ConnectionParameterError extends DBError {
  constructor() {
    super('Connection parameter is required');
    this.name = 'ConnectionParameterError';
  }
}

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
