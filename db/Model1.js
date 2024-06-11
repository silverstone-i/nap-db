// .db/Model.js
'use strict';

const { DBError } = require('./errors');

/**
 * Model class for creating, reading, updating, and deleting records in a database table.
 * @class Model - Base class for managing CRUD and other database operations
 * @constructor
 */
class Model {
  // static csCounter = 0;
  /**
   * Creates an instance of Model.
   * @param {Object} db - The database connection object
   * @param {Object} pgp - The pg-promise instance
   * @param {TableSchema} schema - The schema object
   * @throws {DBError} - If the db, pgp, or schema parameters are invalid
   * @memberof Model
   * @constructor
   */
  constructor(db, pgp, schema) {
    try {
      if (!db || !pgp) {
        const message = !db
          ? 'Invalid database.'
          : 'Invalid pg-promise instance.';

        throw new DBError(message);
      }

      if (!schema || !schema.tableName || !schema.columns) {
        const message = !schema
          ? 'Invalid schema.'
          : !schema.tableName
          ? 'Table name must be defined.'
          : 'Schema requires at least one columns.';

        throw new DBError(message);
      }

      this.db = db;
      this.pgp = pgp;
      if (!schema.dbSchema) schema.dbSchema = 'public';
      if (!schema.timeStamps) schema.timeStamps = true;
      this.schema = JSON.parse(JSON.stringify(schema));
      // this.csCount = 0;
      this.cs = this.createColumnSet();
      // console.log('Model initialized', this.cs !== null);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Returns the column set object for the model
   * @readonly
   * @memberof Model
   * @returns {Object} - The column set object
   */
  get columnset() {
    return this.cs;
  }

  /**
   * Creates the database table based on the schema provided
   * @async
   * @memberof Model
   * @returns {Promise} - The result of the database query
   * @throws {DBError} - If the table creation fails
   */
  async createTableInDB() {
    try {
      return await this.db.none(this.createTableQuery());
    } catch (err) {
      throw new DBError('Failed to create table.', err.message);
    }
  }

  /**
   * Generates the SQL definition for a column.
   *
   * @param {string} name - The name of the column.
   * @param {ColumnConfig} config - The configuration of the column.
   * @returns {string} The SQL definition of the column.
   */
  #generateColumnDefinition(name, config) {
    const parts = [`${name} ${config.type}`];

    if (config.primaryKey) parts.push('PRIMARY KEY');
    if (!config.nullable) parts.push('NOT NULL');
    if (config.default !== undefined) parts.push(`DEFAULT ${config.default}`);
    if (config.generated)
      parts.push(`GENERATED ALWAYS AS (${config.generated}) STORED`);
    if (config.unique) parts.push('UNIQUE');
    if (config.references) parts.push(`REFERENCES ${config.references}`);
    if (config.onDelete) parts.push(`ON DELETE ${config.onDelete}`);
    if (config.onUpdate) parts.push(`ON UPDATE ${config.onUpdate}`);
    if (config.check) parts.push(`CHECK (${config.check})`);
    if (config.collate) parts.push(`COLLATE ${config.collate}`);
    if (config.comment) parts.push(`COMMENT '${config.comment}'`);
    if (config.constraint) parts.push(`CONSTRAINT ${config.constraint}`);
    if (config.index) parts.push(`INDEX ${config.index}`);

    return parts.join(' ');
  }

  /**
   * Generates the SQL definitions for constraints.
   *
   * @param {ConstraintsConfig} constraints - The constraints configuration.
   * @returns {string} The SQL definitions for the constraints.
   */
  #generateConstraints(constraints) {
    return Object.entries(constraints)
      .map(([name, config]) => `CONSTRAINT ${name} ${config}`)
      .join(',\n');
  }

  /**
   * Generates the SQL definitions for indexes.
   *
   * @param {string} tableName - The name of the table.
   * @param {Object.<string, IndexConfig>} indexes - The indexes configuration.
   * @returns {string} The SQL definitions for the indexes.
   */
  #generateIndexes(tableName, indexes) {
    return Object.entries(indexes)
      .map(([indexName, { unique, config }]) => {
        const uniqueClause = unique ? 'UNIQUE ' : '';
        return `CREATE ${uniqueClause}INDEX ${indexName} ON ${tableName} (${config});`;
      })
      .join('\n');
  }

  /**
   * Generates a SQL CREATE TABLE query based on the provided schema.
   *
   * @param {Schema} schema - The schema defining the table structure.
   * @returns {string} The generated SQL CREATE TABLE query.
   */
  createTableQuery(schema = this.schema) {
    const columns = Object.entries(schema.columns)
      .map(([name, config]) => this.#generateColumnDefinition(name, config))
      .join(',\n');

    const timeStampColumns = schema.timeStamps
      ? `, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, 
       created_by VARCHAR(50) NOT NULL, 
       updated_at TIMESTAMPTZ DEFAULT NULL, 
       updated_by VARCHAR(50) DEFAULT NULL`
      : '';

    const constraints = schema.constraints
      ? this.#generateConstraints(schema.constraints)
      : '';
    const indexes = schema.indexes
      ? this.#generateIndexes(schema.tableName, schema.indexes)
      : '';

    return `CREATE TABLE IF NOT EXISTS ${schema.tableName} (
    ${columns}${timeStampColumns}${constraints ? ',\n' + constraints : ''}
  );\n${indexes}`;
  }

  /**
   * Drops the database table
   * @async
   * @memberof Model
   * @returns {Promise} - The result of the database query
   * @throws {DBError} - If the table drop fails
   */
  async drop() {
    try {
      return await this.db.none(`DROP TABLE ${this.schema.tableName};`);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Inserts a record into the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - Status of the insert operation (200)
   * @throws {DBError} - If the insert operation fails
   *
   * @example
   * ...
   * // Typical DTO - all required fields must be provided or the insert will fail
   * const dto = {
   *  name: 'John Doe',
   *  email: 'john@description.com
   *  age: 30,
   *  created_by: 'admin'
   * };
   * ...
   */
  async insert(dto) {
    try {
      const qInsert = this.pgp.helpers.insert(dto, this.cs.insert);
      return await this.db.none(qInsert, dto);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Inserts a record into the database table and returns the specified fields
   * @async
   * @param {object} dto - The data transfer object
   * @returns {Promise} - Status of the insert operation (200)
   * @throws {DBError} - If the insert operation fails
   *
   * @example
   * ...
    const dto = {
      name: 'John Doe',
      email: 'john@description.com
      age: 30,
      created_by: 'admin'
      returning: 'RETURNING id, name, email'
    };
   */
  async insertReturning(dto) {
    try {
      const returning = dto.returning || '*';
      delete dto.returning;
      const qInsert =
        this.pgp.helpers.insert(dto, this.cs.insert) + ' ' + returning;
      return await this.db.one(qInsert, dto);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Fetches all records from the database table in batches of a set size
   * @async
   * @param {Object} dto - The data transfer object to specfiy rwuired fields
   * @param {uuid} cursor - The starting record of the batch - starting value is null
   * @param {integer} limit - The number of records to fetch per batch - default is 25
   * @memberof Model
   * @returns {Promise} - The records fetched
   * @throws {DBError} - If the fetch operation fails
   * @abstract
   * @example
   * ...
   * // Typical DTO - only the condition fields are required
   * const dto = {
   *    ...fields to fetch = '', null or undefined
   *};
   */
  async fetch(dto, cursor, limit = 25) {
    try {
      const keys = dto ? Object.keys(dto) : [];
      const keyString = keys.length > 0 ? keys.join(', ') : '*';
      const params = [parseInt(limit)];
      let query = `SELECT ${keyString} FROM ${this.schema.tableName} ORDER BY id ASC LIMIT $1`;

      if (cursor) {
        query = `SELECT ${keyString} FROM ${this.schema.tableName} WHERE id > $1 ORDER BY id ASC LIMIT $2`;
        params.unshift(cursor);
      }

      const data = await db.any(query, params);
      return data;
    } catch (error) {
      throw new DBError(
        `Failed to fetch data from ${this.schema.tableName}: ${error.message}`
      );
    }
  }

  async fetchFiltered(dto) {}

  /**
   * Selects records from the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - The records selected
   * @throws {DBError} - If the select operation fails
   *
   * @example
   *
   * Select all columns from the table
   * ...
   * const dto = {
   *  id: 1,
   *  _condition: 'WHERE id = ${id}'
   * };
   * ...
   *
   * Select specific columns from the table
   * ...
   * const dto = {
   *  id: 1,
   *  name: '',
   *  email: '',
   *  _condition: 'WHERE id = ${id}'
   * };
   * ...
   */
  async select(dto) {
    try {
      // Build the WHERE clause
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
        dto = Object.fromEntries(
          Object.entries(dto).filter(([key, value]) => value === '')
        ); // Convert object to array and back to object to remove condition values
      }

      // Build the SELECT query
      const qSelect =
        Object.keys(dto).length === 0 && dto.constructor === Object
          ? `SELECT * FROM ${this.schema.tableName} ${condition};`
          : this.pgp.as.format(
              `SELECT $1:name FROM ${this.schema.tableName} ${condition};`,
              [dto]
            );

      return await this.db.any(qSelect);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Selects a single record from the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - The record selected or null record if the record is not found
   * @throws {DBError} - If the select operation fails
   *
   *
   */
  async selectOne(dto) {
    try {
      // Build the WHERE clause
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
        dto = Object.fromEntries(
          Object.entries(dto).filter(([key, value]) => value === '')
        ); // Convert object to array and back to object to remove condition values
      }

      // Build the SELECT query
      const qSelect =
        Object.keys(dto).length === 0 && dto.constructor === Object
          ? `SELECT * FROM ${this.schema.tableName} ${condition};`
          : this.pgp.as.format(
              `SELECT $1:name FROM ${this.schema.tableName} ${condition};`,
              [dto]
            );

      return await this.db.oneOrNone(qSelect);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Updates records in the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - The result of the update operation
   * @throws {DBError} - If the update operation fails
   *
   * @example
   * ...
   * // Typical DTO - only the fields to be updated are required along with the condition  fields
   * const dto = {
   *  id: 1,
   *  name: 'John Doe',
   *  email: 'jane@description.com',
   *  updated_by: 'admin',
   *  _condition: 'WHERE id = ${id}'
   * };
   * ...
   */
  async update(dto) {
    try {
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
      } else {
        throw new DBError('UPDATE requires a condition');
      }

      const qUpdate = `${this.pgp.helpers.update(
        dto,
        this.cs.update
      )} ${condition};`;

      const result = await this.db.result(qUpdate, (a) => a.rowCount);

      if (result.rowCount === 0) {
        throw new DBError('No records found to update.');
      }

      return result;
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Deletes records from the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - The result of the delete operation
   * @throws {DBError} - If the delete operation fails
   *
   * @example
   *
   * Delete all records from the table
   * ...
   * const dto = { );
   * ...
   *
   *  Delete specific records from the table
   * ...
   * // Typical DTO - only the condition fields are required
   * const dto = {
   *  id: 1,
   *  _condition: 'WHERE id = ${id}'
   * };
   * ...
   */
  async delete(dto) {
    try {
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
      } else {
        throw new DBError('DELETE requires a condition');
      }

      const qDelete = this.pgp.as.format(
        `DELETE FROM ${this.schema.tableName} ${condition};`,
        [dto]
      );

      const result = await this.db.result(qDelete, (a) => a.rowCount);
      if (result.rowCount === 0) {
        throw new DBError('No records found to delete');
      }

      return result;
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Truncates the database table
   * @async
   * @memberof Model
   * @returns {Promise} - The result of the truncate operation
   * @throws {DBError} - If the truncate operation fails
   */
  async truncate() {
    try {
      return await this.db.none(`TRUNCATE TABLE ${this.schema.tableName};`);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Counts the number of records in the database table
   * @async
   * @param {Object} dto - The data transfer object
   * @memberof Model
   * @returns {Promise} - The count of records in the table
   * @throws {DBError} - If the count operation fails
   *
   * @example
   *
   * Count records per the provided condition
   * ...
   * // Typical DTO - only the condition fields are required
   * const dto = {
   * id: 1,
   * _condition: 'WHERE id = ${id}'
   * };
   * ...
   *
   * Count all records in the table
   * ...
   * const dto = { );
   *
   */
  async count(dto) {
    try {
      if (!dto) {
        dto = {};
      }

      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
      }

      const qCount =
        `SELECT COUNT(*) FROM ${this.schema.tableName} ${condition};`.replace(
          /\s*([.,;:])\s*|\s{2,}|\n/g,
          '$1'
        );

      const count = await this.db.one(qCount, (a) => +a.count);

      return count;
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Creates the column set object for the model
   * @memberof Model
   * @returns {Object} - The column set object
   * @throws {DBError} - If the column set creation fails
   * @private
   */
  createColumnSet() {
    if (!this.cs) {
      // console.log('Creating column set', ++Model.csCounter);

      const columns = Object.keys(this.schema.columns)
        .map((column) => {
          const isPrimaryKey = this.schema.columns[column].primaryKey || false;
          const hasDefault =
            this.schema.columns[column].hasOwnProperty('default');
          if (
            this.schema.columns[column].type === 'serial' ||
            (this.schema.columns[column].type === 'uuid' &&
              isPrimaryKey &&
              hasDefault)
          )
            return null; // ignore serial or uuid primary key columns

          let columnObject = {
            name: column,
            prop: column,
          };
          isPrimaryKey
            ? (columnObject.cnd = true)
            : (columnObject.skip = (c) => !c.exists);
          hasDefault
            ? (columnObject.def = this.schema.columns[column].default)
            : null;
          return columnObject;
        })
        .filter((column) => column !== null); // Filter out null entries (serial columns);

      const cs = {};
      cs[this.schema.tableName] = new this.pgp.helpers.ColumnSet(columns, {
        table: { table: this.schema.tableName, schema: this.schema.dbSchema },
      });
      cs.insert = cs[this.schema.tableName].extend(['created_by']);
      cs.update = cs[this.schema.tableName].extend([
        {
          name: `updated_at`,
          mod: '^',
          def: 'CURRENT_TIMESTAMP',
        },
        `updated_by`,
      ]);

      return cs;
    }

    return this.cs;
  }
}

module.exports = Model;
