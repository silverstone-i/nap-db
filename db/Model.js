// @ts-nocheck
// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const { SqlFileWriter, createColumnsets, timeStamps } = require('./nap');
const packageJson = require('../package.json');

/**
 * Base class used to map columns in a database table
 */
class Model {
    /**
     * Creates a new Model
     * @param {Object} db - {@link https://vitaly-t.github.io/pg-promise/Database.html pg-promise} database connection represented by class {@link DB}
     * @param {Object} pgp - {@link https://vitaly-t.github.io/pg-promise/module-pg-promise.html pg-promise} object
     * @param {DataSchema} schema - Table schema to map columns
     */
    constructor(db, pgp, schema) {
        this.schema = schema;
        this.originalSchema = JSON.parse(JSON.stringify(schema));
        if (schema.timeStamps === undefined || schema.timeStamps)
            this.schema.columns = [...schema.columns, ...timeStamps];
        this.db = db;
        this.pgp = pgp;
    }
    /**
     * Gets the current select all query string
     * @description
     * The select all query is intially set to
     * SELECT [colmns] FROM tablename
     */
    get selectAll() {
        return this._selectAll;
    }

    /**
     * Sets a new select all query string
     */
    set selectAll(query) {
        this._selectAll = query;
    }

    /**
     * Gets the current where query string to select records
     * @description
     * The select where query is intially set to
     * SELECT [colmns] FROM tablename WHERE [column] = value;
     */
    get selectWhere() {
        return this._selectWhere;
    }

    /**
     * Sets a new select where query string
     */
    set selectWhere(query) {
        this._selectWhere = query;
    }

    /**
     * Gets the current update where clause for the update query string
     * @description
     * The update where query is intially set to
     * WHERE [primaryKeyColumn] = value
     */
    get updateCondition() {
        return this._updateCondition;
    }

    /**
     * Sets a new update where query string
     */
    set updateCondition(query) {
        this._updateCondition = query;
    }

    /**
     * Get primary key column name
     * @returns {PrimaryKey[]} - Array of primary key objects
     * @example
     * ...
     * const primaryKeys = [{ name: 'company_id }, { name: 'account_id' }];
     */
    primaryKeyColumn() {
        if (this.schema.primaryKeys.length === 1) {
            // Replicates behavior of single primary key prior to v0.4.0
            return this.schema.primaryKeys[0].name;
        }

        // multiple PRIMARY KEY columns
        return this.schema.primaryKeys;
    }

    /**
     * reate record Crud
     * @param {Object} dto - Data Transfer Object specifying the fields to be inserted
     * @returns {void}
     */
    insert(dto) {
        const query = this.pgp.helpers.insert(dto, this.cs.insert);
        return this.db.none(query).catch((err) => Promise.reject(err));
    }

    /**
     * Performs a SELECT statement based on the information in the DTO object
     * - Columns to be returned by the select statement
     * - _condition - search condition i.e. WHERE clause - string
     * - _params - parameters associated with _condition - Array
     *
     * @param {DTO} dto
     * @returns {Array<Object>|string} - returns an array of rows found a single row or an error message
     *
     * @example
     * ...
     * const dto = {
     *      "company_id": "",
     *      "account_id": "",
     *      "name": "",
     *      "_condition": "WHERE company_id = $1 AND account_id = $2;"
     *      "_params": [ '000', '1.1.1000']
     * }
     * ...
     * Produces
     *  SELECT "company_id", "account_id", "name" FROM accounts WHERE company_id = '000' AND account_id = '1.1.1000';
     */
    find(dto) {
        let condition = '';
        if (dto._condition) {
            condition = this.pgp.as.format(dto._condition, dto);
            delete dto._condition;
        }

        const query =
            this.pgp.as.format(
                `SELECT $1:name FROM ${this.schema.tableName} `,
                [dto]
            ) + condition;

        return this.db.any(query).catch((err) => Promise.reject(err));
    }

    /**
     * Update record crUd - this will not work for multi-column primary keys
     * @param {Object} dto - Data Transfer Object specifying the fields to be updated
     * @returns {void}
     */
    update(dto) {
        const condition = this.pgp.as.format(dto._condition, dto);
        const query = this.pgp.helpers.update(dto, this.cs.update) + condition;

        return this.db
            .result(query)
            .then((result) => {
                if (result.rowCount === 0) {
                    // No rows were updated, handle the case where the record does not exist
                    throw new Error('Record does not exist');
                }
            })
            .catch((err) => Promise.reject(err));
    }

    /**
     * Delete record cruD
     * @param {DTO} dto - DTO containg primary key/s and delete condition
     * @returns {void}
     */
    delete(dto) {
        let condition = '';
        if('_condition' in dto) {
            condition = this.pgp.as.format(dto._condition, dto);
            delete dto._condition;
        }
        const query = `DELETE FROM ${this.schema.tableName} ` + condition

        return this.db
            .result(query)
            .then((result) => {
                if (result.rowCount === 0) {
                    // No rows were updated, handle the case where the record does not exist
                    throw new Error('Record does not exist');
                }
            })
            .catch((err) => Promise.reject(err));
    }

    // Create table
    /**
     * Builds the SQL required to CREATE TABLE based on the {@link TableSchema}
     * @returns {void}
     */
    createTable() {
        return this.writeCreateTableFile()
            .then((qf) => this.db.none(qf))
            .catch((err) => Promise.reject(err));
    }

    /**
     * Writes CREATE table SQL to an SQL file. This method is primarily for internal use
     * @returns {Object} - {@link http://vitaly-t.github.io/pg-promise/QueryFile.html QueryFile} to execute the CREATE TABLE query
     */
    writeCreateTableFile() {
        const writer = new SqlFileWriter(this.schema);
        return writer
            .writeCreateTableSQL()
            .then((qf) => qf)
            .catch((err) => Promise.reject(err));
    }

    /**
     * Creates a ColumnSet from the provided TableSchema
     * @returns {Object} - pg-promise {@link https://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html ColumnSet}
     * @description
     * This method is used to create a columnset by a derived class that is static. Using createColumnsets followed by
     * setColumnsets ensures only a single instance of the derived class ColumnSet is created.  This is illustrated in
     * the following example
     * @example
     *
     * userSchema = {
     *      tableName: 'users',
     *      columns: [
     *          {
     *              name: 'email',
     *              type: 'varchar',
     *              length: 255,
     *          },
     *          {
     *              name: 'password',
     *              type: 'varchar',
     *              length: 50,
     *              notNull: true,
     *          },
     *          {
     *              name: 'employee_id',
     *              type: 'int4',
     *              notNull: true,
     *          },
     *          {
     *              name: 'full_name',
     *              type: 'varchar',
     *              length: 50,
     *              notNull: true,
     *          },
     *          {
     *              name: 'role',
     *              type: 'varchar',
     *              length: 25,
     *              notNull: true,
     *          },
     *          {
     *              name: 'active',
     *              type: 'bool',
     *              notNull: true,
     *              default: true
     *          },
     *      ],
     *      primaryKeys: [ { name: 'email' } ]
     *      foreignKeys: [
     *          {
     *              hasRelations: [
     *                  {
     *                      name: 'employee_id',
     *                  },
     *              ],
     *              withColumns: [
     *                  {
     *                      name: 'id',
     *                  },
     *              ],
     *              withTable: 'employees',
     *          },
     *      ],
     *  };
     *  class Users extends Model {
     *      static #cs;
     *      // Deep copy userSchema to ensure it does not change
     *      constructor(db, pgp, schema = JSON.parse(JSON.stringify(userSchema))) {
     *          super(db, pgp, schema);
     *
     *          // This ensures the column set is only created once for each User instance
     *          if(!Users.#cs) {
     *              Users.#cs = this.createColumnsets();
     *              super.setColumnsets(Users.#cs);
     *          }
     *      }
     *      insert(dto) {
     *          dto.email = dto.email.toLowerCase();
     *          return super.insert(dto).catch( (err) => Promise.reject(err));
     *      }
     *  }
     */
    createColumnsets() {
        return createColumnsets(this.pgp, this.originalSchema);
    }

    /**
     * Sets the statically created ColumnSet in the derived class in the base class
     * @param {Object} cs - pg-promise {@link https://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html ColumnSet}
     */
    setColumnsets(cs) {
        this.cs = cs;
    }
}

module.exports = Model;
