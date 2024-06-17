
<div style="display: flex; justify-content: left;">
<img width="150" alt="nap-logo" src="https://github.com/silverstone-i/nap-db/blob/8bba6fc357c50688a080d5afcb6b2ace05a813f0/assets/nap-logo.png?raw=true" />
</div>

# nap-db

## Overview

`nap-db` provides a robust database interaction layer for PostgreSQL using JavaScript, leveraging the `pg-promise` library. It includes classes to manage database connections, build and execute SQL queries, and perform CRUD operations efficiently.

## Features

- **CRUD Operations**: Perform create, read, update, and delete operations on database tables.
- **Table Management**: Create and manage tables with support for all PostgreSQL field types, constraints, references, and indexes.
- **Advanced Querying**: Use the `SelectQueryBuilder` class to build dynamic queries, including all PostgreSQL aggregate functions.
- **Utility Methods**: Supports additional operations like drop, truncate, and more.
- **Extendable**: Easily extend base classes to create custom models and queries.

## Installation

Install the library using npm:

```bash
npm i nap-db
```

## Usage

### Initialize the Database

```javascript
require('dotenv').config();
const { DB, Model } = require('nap-db');

// Define a User model
class Users extends Model {
  constructor(db, pgp) {
    const schema = {
      tableName: 'users',
      dbSchema: 'public',
      timeStamps: true,
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

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

const repositories = { users: Users };
const db = DB.init(connection, repositories);

// Server setup code...
```

## Documentation

For detailed documentation, visit the [nap-db documentation](https://silverstone-i.github.io/nap-db/).

## Classes and Methods

### DB

The `DB` class initializes and manages the database connection.

#### Methods

- `DB.init(connection, repositories)`: Initializes the database with the provided connection parameters and repositories.

### Model

The `Model` class extends `SelectQueryBuilder` and provides a base for defining database models.

#### Constructor

- `Model(db, pgp, schema)`: Initializes a new instance of the `Model` class with the given schema.

### SelectQueryBuilder

The `SelectQueryBuilder` class is used to dynamically build SQL SELECT queries.

#### Methods

- `buildQuery()`: Builds the query based on the specified table, aggregates, and values.
- `addJoins(query)`: Adds joins to the query.
- `addWhereClause(query)`: Adds a WHERE clause based on specified conditions.

### Errors

Custom error classes for specific database-related errors.

#### Classes

- `DBError`: Base class for custom database errors.
- `ConnectionParameterError`: Thrown when the connection parameter is missing.
- `RepositoriesParameterError`: Thrown when the repositories parameter is missing or invalid.

## Change Log

### v1.0.4 - Beta 1

- Added missing default value handling for boolean types.
- Replaced the doc-dash template with the clean-jsdoc-theme template.
- Added SelectBuildQuery and QueryOptions classes to enhance query creation flexibility
- v1.0.4 - Beta 1 is a breaking change to previous versions

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
