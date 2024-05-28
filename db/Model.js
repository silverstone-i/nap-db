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
  async init() {
    try {
      return await this.db.none(this.createTableQuery());
    } catch (err) {
      throw new DBError('Failed to create table.', err.message);
    }
  }

  /**
   * Creates the SQL query to create the table based on the schema provided
   * @memberof Model
   * @returns {string} - The SQL query to create the table
   * @throws {DBError} - If the table creation query fails
   */
  createTableQuery() {
    let columns = Object.entries(this.schema.columns)
      .map(([name, config]) => {
        let column = `${name} ${config.type}`;
        if (config.primaryKey) {
          column += ' PRIMARY KEY';
        }
        if (!config.nullable) {
          column += ' NOT NULL';
        }
        if (config.hasOwnProperty('default')) {
          column += ` DEFAULT ${config.default}`;
        }
        return column;
      })
      .join(',\n');

    if (this.schema.timeStamps) {
      columns += `,\ncreated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,\ncreated_by varchar(50) NOT NULL,\nupdated_at timestamptz NULL DEFAULT NULL,\nupdated_by varchar(50) NULL DEFAULT NULL`;
    }

    const foreignKeys = this.schema.foreignKeys
      ? Object.entries(this.schema.foreignKeys)
          .map(([name, config]) => {
            return `FOREIGN KEY (${name}) REFERENCES ${
              config.referenceTable
            }(${config.referenceColumns.join(',')}) ON DELETE ${
              config.onDelete
            } ON UPDATE ${config.onUpdate}`;
          })
          .join(',\n')
      : '';

    const uniqueConstraints = this.schema.uniqueConstraints
      ? Object.entries(this.schema.uniqueConstraints)
          .map(([name, config]) => {
            const columns = config.columns.join(',');
            return `CONSTRAINT ${name} UNIQUE (${columns})`;
          })
          .join(',\n')
      : '';

    return `CREATE TABLE IF NOT EXISTS ${this.schema.tableName} (\n${columns}${
      foreignKeys ? ',\n' + foreignKeys : ''
    }${uniqueConstraints ? ',\n' + uniqueConstraints : ''}\n);`;
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
          if (this.schema.columns[column].type === 'serial') return null; // ignore serial columns

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
