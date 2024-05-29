 <div style="display: flex; justify-content: left;">
<img width="150" alt="nap-logo" src="https://github.com/silverstone-i/nap-db/blob/8bba6fc357c50688a080d5afcb6b2ace05a813f0/assets/nap-logo.png?raw=true" />
</div>

## Goal

Model database tables based on a user provided data schema to map the model to the database classes

The promise library pg-promise offers simple and flexible methods to efficiently interact with Postgres database. As such we chose to use the [pg-promise](https://vitaly-t.github.io/pg-promise/) functionality into a base class that can be easily extended to provide CRUD operations and map the class to a database table.

## TODO

The current library only supports parametirizedQuery operations. 

Provide future support for
  - [ ] parametized Statements
  - [ ] cursor operations for negotiating through large datasets

## Documentation

[nap-db documentation](https://silverstone-i.github.io/nap-db/)

## Install

npm i nap-db

## Usage

This module offers 2 classes

class DB - initialize database

class Model - CRUD and table mapping

## Usage Examples

Define a User class:

```javascript
require('dotenv').config();
const { DB, Model } = require('nap-db');


// Define a model to map the users table
class Users extends Model {
  constructor(db, pgp) {
    const schema = {
      tableName: 'users',
      dbSchema: 'public',
      timeStamps: true, // Add time stamps to table - default is true
      columns: {
        email: { type: 'varchar(255)', primaryKey: true },
        password: { type: 'varchar(255)', nullable: false },
        employee_id: { type: 'int4', nullable: false },
        full_name: { type: 'varchar(50)', nullable: false },
        role: { type: 'varchar(25)', nullable: false, default: 'user' },
        active: { type: 'bool', nullable: false, default: true },
      },
    };
    super(db, pgp, schema);

    this.createColumnSet();
  }
}

// setup database

// repositories
// Get DB connetion info from your .env file
try {
const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

// repositories
const repositories = { users: Users };


const db = DB.init(connection, repositories);

//Setup server code...

} catch(error) {
  console.log("Internal server error", error.message, error);
}

```

Change Log

v1.0.4

1. Corrected missing default value when { type: boolean, default: false }.  Will now add the proper default value to the create table SQL
2. Corrected missing default value when { type: boolean, default: false }.  Will now add the proper default when creating the columnset.
3. Replaced the doc-dash template with the clean-jsdoc-theme template so that dark/light mode is availabble out of the box.
4. Added selectOne method to the Model class, to facilitate easier handling when only 1 record is expected
5. Added support for uuid type columns
6. Added constraints type to the schema - should be used instead of ForeignKeyConfig and UniqueConstraint types
7. Updated docs to reflect changes


## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

copyright © 2023 to present Ian Silverstone ian@isilverstone.com
