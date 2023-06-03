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
        this._selectAll = `SELECT $1:name FROM ${this.schema.tableName}`;
        this._selectWhere = `SELECT $1:name FROM ${this.schema.tableName} WHERE $2:name = $3;`;
        this._updateCondition =
            ` WHERE ${this.primaryKeyColumn()} = ` +
            '${' +
            `${this.primaryKeyColumn()}` +
            '};';
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
     * @returns {string|null|PrimaryKey[]} - Name of tables PRIMARY KEY
     */
    primaryKeyColumn() {
        if (!this.schema.primaryKeys) {
            // version of library that is <= v0.3.0
            const primaryKeyColumn = this.schema.columns.find(
                // @ts-ignore
                (column) => column.primary
            );

            return primaryKeyColumn ? primaryKeyColumn.name : null;
        } else if (this.schema.primaryKeys.length === 1) {
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
     * Read records cRud
     * @param {Object} dto - Data Transfer Object specifying the fields to be selected
     * @returns {Array<Object>} - Array of rows selected or 'Records not found' message
     */
    findAll(dto) {
        const query = this.pgp.as.format(this._selectAll, [dto]);

        return this.db.any(query).catch((err) => Promise.reject(err));
    }

    /**
     * Locate a specific record - cRud
     * @param {Object} dto - Data Transfer Object specifying the fields to be selected
     * @param {string} column - the name of the column used to locate the record
     * @param {string|number} value - Array of rows selected or 'Records not found' message
     * @returns {void}
     */
    findWhere(dto, column, value) {
        const query = this.pgp.as.format(this._selectWhere, [
            dto,
            column,
            value,
        ]);

        return this.db.oneOrNone(query).catch((err) => Promise.reject(err));
    }

    /**
     * Update record crUd
     * @param {Object} dto - Data Transfer Object specifying the fields to be updated
     * @returns {void}
     */
    update(dto) {
        const condition = this.pgp.as.format(this._updateCondition, dto);
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
     * @param {string|number} idValue - Value of PRIMARY KEY record to be deleted
     * @returns {void}
     */
    purge(idValue) {
        const deleteRow = `DELETE FROM ${
            this.schema.tableName
        } WHERE ${this.primaryKeyColumn()} = $1`;
        const query = this.pgp.as.format(deleteRow, [idValue]);
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

    // Execute query string
    /**
     * Executes provided query string - This method is not safe and is intended for reporting
     * Make sure the query string is properly validated and sanitized so the database is not corrupted
     * @param {string} queryString - SQL to be executed
     */
    executeQuery(queryString) {
        this.db
            .any(queryString)
            .then((dto) => dto)
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
     *              primary: true
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
