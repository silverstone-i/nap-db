 <div style="display: flex; justify-content: left;">
<img width="150" alt="nap-logo" src="https://github.com/silverstone-i/nap-db/blob/8bba6fc357c50688a080d5afcb6b2ace05a813f0/assets/nap-logo.png?raw=true" />
</div>

## Motivation

Need a simple way to map database tables to a DTO for an Expressjs prototype project and do not want to go through a steep learning curve that an ORM can present. The promise library pg-promise offers simple and flexible methods to efficiently interact with Postgres database. As such we chose to wrap the [pg-promise](https://vitaly-t.github.io/pg-promise/) functionality into a base class that can be easily extended to provide CRUD operations and map the class to a database table.

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
const { Model } = require('nap-db');

const userSchema = {
  tableName: 'users',
  columns: [
    {
      name: 'email',
      type: 'varchar',
      length: 255,
      primary: true,
    },
    {
      name: 'password',
      type: 'varchar',
      length: 50,
      notNull: true,
    },
    {
      name: 'employee_id',
      type: 'int4',
      notNull: true,
    },
    {
      name: 'full_name',
      type: 'varchar',
      length: 50,
      notNull: true,
    },
    {
      name: 'role',
      type: 'varchar',
      length: 25,
      notNull: true,
    },
    {
      name: 'active',
      type: 'bool',
      notNull: true,
      default: true,
    },
  ],
  foreignKeys: [
    {
      hasRelations: [
        {
          name: 'employee_id',
        },
      ],
      withColumns: [
        {
          name: 'id',
        },
      ],
      withTable: 'employees',
    },
  ],
};

class Users extends Model {
  static #cs;

  // Deep copy userSchema to ensure it does not change
  constructor(db, pgp, schema = JSON.parse(JSON.stringify(userSchema))) {
    super(db, pgp, schema);

    // This is implemented this way to help remind developers to use a static variable
    if (!Users.#cs) {
      Users.#cs = this.createColumnsets();
      super.setColumnsets(Users.#cs);
    }
  }

  // Override Model.insert method.  For illustration only. Don't recommend doing validation here!!
  insert(dto) {
    dto.email = dto.email.toLowerCase();
    return super.insert(dto).catch((err) => Promise.reject(err));
  }
}

module.exports = Users;
```

Create a DB connection Object

```javascript
const { DB } = require('nap-db');

// repositories in the databa
const repositories = {
  users: Users,
};

// Read DB connection object from configuration file
const connection = config.get('connection');
const db = DB.init(connection, repositories);

//Test the connection
db.connect()
  .then((obj) => {
    console.log('Connected to Postgres database!');
    obj.done(); // success, release connection;
  })
  .catch((error) => {
    console.log('Error connecting to Postgres database:', error.message);
  });
```

A typical connection object could be formatted as follows

```javascript
{
    "connection": {
        "user": "<user_name>",
        "password": "<user-password>",
        "database": "<PostgreSQL database>",
        "host": "localhost",
        "port": 5432
    }
}
```

## License

#MIT

copyright © 2023 to present Ian Silverstone ian@isilverstone.com
