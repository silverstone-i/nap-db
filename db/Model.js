// .db/Model.js
'use strict';

class Model {
  /**
   * @class Model
   * @classdesc Represents a database model.
   */
  constructor(db, pgp, schema) {
    this.db = db;
    this.pgp = pgp;
    this.schema = JSON.parse(JSON.stringify(schema));
  }

  /**
   * @method Model#setColumnsets
   * @description Sets the column sets for the model.
   * @param {Object} cs - The column sets to set.
   * @returns {void}
   * @example
   *
   * class Users extends Model {
   *  static #cs;
   *  constructor(db, pgp) {
   *    const schema = {
   *      tableName: 'users',
   *      timeStamps: true, // Add time stamps to table - default is true
   *      columns: {
   *        id: { type: 'serial', nullable: false }, // Serial type column
   *        email: { type: 'varchar(255)', primaryKey: true },
   *        password: { type: 'varchar(255)', nullable: false },
   *      },
   *      uniqueConstraints: {
   *        users_id_unique: { columns: ['id'] },
   *      },
   *    };
   *    super(db, pgp, schema);
   *
   *   Set column set. Simplifies access to the column set for this instance of the Users class and prevents calling Users.createColumnSet each time pgp is reinitialized
   *    if(!Users.#cs  ){
   *      Users.#cs = this.createColumnSet();
   *      setColumnsets(Users.#cs);
   *    }
   * }
   *
   */
  setColumnsets(cs) {
    this.cs = cs;
  }

  /**
   * @method Model#init
   * @description Initializes the model by creating the table in the database.
   * @returns {Promise} A promise that resolves when the table is created.
   */
  async init() {
    // Create the table
    await this.db.none(this._createTableQuery());
  }

  /**
   * @method Model#createTableQuery
   * @description Generates the SQL query to create the table.
   * @returns {string} The SQL query to create the table.
   */
  _createTableQuery() {
    let columns = Object.entries(this.schema.columns)
      .map(([name, config]) => {
        let column = `${name} ${config.type}`;
        if (config.primaryKey) {
          column += ' PRIMARY KEY';
        }
        if (!config.nullable) {
          column += ' NOT NULL';
        }
        if (config.default) {
          column += ` DEFAULT ${config.default}`;
        }
        return column;
      })
      .join(',\n');

    // Add timestamps columns if timeStamps is true
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
   * @method Model#drop
   * @description Drops the table from the database.
   * @returns {Promise} A promise that resolves when the table is dropped.
   */
  async drop() {
    await this.db.none(`DROP TABLE IF EXISTS ${this.schema.tableName};`);
  }

  /**
   * @method Model#insert
   * @description Inserts a row into the table.
   * @param {Object} data - The data to insert.
   * @returns {Promise} A promise that resolves when the row is inserted.
   */
  async insert(data) {
    const keys = Object.keys(data).join(',');
    const values = Object.values(data)
      .map((value) => (typeof value === 'string' ? `'${value}'` : value))
      .join(',');
    return this.db.none(
      `INSERT INTO ${this.schema.tableName} (${keys}) VALUES (${values});`
    );
  }

  /**
   * @method Model#select
   * @description Selects rows from the table.
   * @param {Object} [filters] - The filters to apply to the query.
   * @returns {Promise} A promise that resolves with the selected rows.
   */
  async select(filters) {
    const where = filters
      ? `WHERE ${Object.entries(filters)
          .map(
            ([key, value]) =>
              `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
          )
          .join(' AND ')}`
      : '';
    return this.db.any(`SELECT * FROM ${this.schema.tableName} ${where};`);
  }

  /**
   * @method Model#update
   * @description Updates rows in the table.
   * @param {Object} filters - The filters to apply to the query.
   * @param {Object} data - The data to update.
   * @returns {Promise} A promise that resolves when the rows are updated.
   */
  async update(filters, data) {
    const where = filters
      ? `WHERE ${Object.entries(filters)
          .map(
            ([key, value]) =>
              `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
          )
          .join(' AND ')}`
      : '';
    const set = Object.entries(data)
      .map(
        ([key, value]) =>
          `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
      )
      .join(',');
    return this.db.none(`UPDATE ${this.schema.tableName} SET ${set} ${where};`);
  }

  /**
   * @method Model#delete
   * @description Deletes rows from the table.
   * @param {Object} filters - The filters to apply to the query.
   * @returns {Promise} A promise that resolves when the rows are deleted.
   */
  async delete(filters) {
    const where = filters
      ? `WHERE ${Object.entries(filters)
          .map(
            ([key, value]) =>
              `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
          )
          .join(' AND ')}`
      : '';
    return this.db.none(`DELETE FROM ${this.schema.tableName} ${where};`);
  }

  /**
   * @method Model#truncate
   * @description Truncates the table.
   * @returns {Promise} A promise that resolves when the table is truncated.
   */

  async truncate() {
    return this.db.none(`TRUNCATE TABLE ${this.schema.tableName};`);
  }

  /**
   * @method Model#count
   * @description Counts the number of rows in the table.
   * @returns {Promise} A promise that resolves with the number of rows.
   */
  async count() {
    return this.db.one(
      `SELECT COUNT(*) FROM ${this.schema.tableName};`,
      [],
      (a) => +a.count
    );
  }

  // Function to create column set
  createColumnSet() {
    const columns = [];

    for (const column in this.schema.columns) {
      if (this.schema.columns.hasOwnProperty(column)) {
        const columnType = this.schema.columns[column].type;
        const isNullable = this.schema.columns[column].nullable || false;
        const defaultValue = this.schema.columns[column].default || null;

        columns.push({
          name: column,
          prop: column,
          mod: ':raw',
          init: (col) => {
            return `${col.name} ${columnType}${isNullable ? '' : ' NOT NULL'}${
              defaultValue ? ` DEFAULT ${defaultValue}` : ''
            }`;
          },
        });
      }
    }

    const columnSet = new this.pgp.helpers.ColumnSet(columns, {
      table: { table: this.schema.tableName, schema: 'public' },
    });

    return columnSet;
  }
}

module.exports = Model;
