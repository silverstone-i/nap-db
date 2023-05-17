const pgPromise = require('pg-promise');

class CustomDB {
  constructor(connectionOptions, repositories) {
    const pgp = pgPromise();
    this.db = pgp(connectionOptions);
    this.repositories = repositories;
  }

  initialize() {
    const initOptions = {
      extend: (obj, dc) => {
        for (const repository of Object.keys(this.repositories)) {
          obj[repository] = new this.repositories[repository](obj, this.db.$config.pgp);
        }
      }
    };

    this.db.$config.pgp = pgPromise(initOptions);
  }

  // Example method to execute a query
  async query(sql, params) {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      // Handle and log errors
      console.error('Error executing query:', error);
      throw error;
    }
  }

  // Add more methods for database operations as needed
  // ...
}

module.exports = CustomDB;

const CustomDB = require('./CustomDB');
const { Users, Products } = require('./repositories'); // Example repositories

const connectionOptions = {
  // Specify your PostgreSQL connection options
};

const repositories = {
  users: Users,
  products: Products
};

const db = new CustomDB(connectionOptions, repositories);
db.initialize();

// Example usage: Execute a query
db.query('SELECT * FROM users')
  .then((result) => {
    // Handle query result
    console.log(result);
  })
  .catch((error) => {
    // Handle error
    console.error(error);
  })
  .finally(() => {
    // Close the database connection
    db.close();
  });
