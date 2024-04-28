// .db/Model.js
'use strict';

class Model {
  /**
   * @class Model
   * @classdesc Represents a database model.
   * @param {Object} db - The database connection.
   * @param {Object} pgp - The pg-promise object.
   * @param {Object} schema - The schema for the model.
   * @param {string} schema.tableName - The name of the table.
   * @param {string} schema.dbSchema - The schema of the table.
   * @param {boolean} [schema.timeStamps=true] - Whether to add timestamps to the table.
   * @param {Object} schema.columns - The columns of the table.
   * @param {string} schema.columns.columnName.type - The type of the column.
   * @param {boolean} [schema.columns.columnName.primaryKey=false] - Whether the column is a primary key.
   * @param {boolean} [schema.columns.columnName.nullable=true] - Whether the column is nullable.
   * @param {string} [schema.columns.columnName.default] - The default value of the column.
   * @param {Object} [schema.foreignKeys] - The foreign keys of the table.
   * @param {string} schema.foreignKeys.columnName.referenceTable - The table the column references.
   * @param {string[]} schema.foreignKeys.columnName.referenceColumns - The columns the column references.
   * @param {string} schema.foreignKeys.columnName.onDelete - The action to take when the referenced row is deleted.
   * @param {string} schema.foreignKeys.columnName.onUpdate - The action to take when the referenced row is updated.
   * @param {Object} [schema.uniqueConstraints] - The unique constraints of the table.
   * @param {string[]} schema.uniqueConstraints.constraintName.columns - The columns of the constraint.
   * @returns {Model} The model.
   *
   * @example
   *
   * class Users extends Model {
   *  constructor(db, pgp) {
   *    const schema = {
   *      tableName: 'users',
   *      dbSchema: 'public',
   *      timeStamps: true,
   *      columns: {
   *        email: { type: 'varchar(255)', primaryKey: true },
   *        password: { type: 'varchar(255)', nullable: false },
   *        employee_id: { type: 'int4', nullable: false },
   *        full_name: { type: 'varchar(50)', nullable: false },
   *        role: { type: 'varchar(25)', nullable: false, default: 'user' },
   *        active: { type: 'bool', nullable: false, default: true },
   *      },
   *    };
   *    super(db, pgp, schema);
   *    this.createColumnSet();
   *  }
   * }
   *
   * const users = new Users(db, pgp);
   */

  constructor(db, pgp, schema) {
    this.db = db;
    this.pgp = pgp;
    this.schema = JSON.parse(JSON.stringify(schema));
    this.cs = null;
  }

  /**
   * @property Model#columnset
   * @description The column set for the model.
   * @type {Object}
   * @readonly
   * @returns {Object} The ColumbSet for the model.
   *
   * @example
   * const users = new Users(db, pgp);
   * const cs = users.columnset;
   *
   */
  get columnset() {
    return this.cs;
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
   * @private
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
   *
   * @example
   * ...
   * const users = new Users(db, pgp);
   * await users.insert({ email: '  [email protected] ', password: 'password', employee_id: 1, full_name: 'John Doe' });
   * ...
   */
  async insert(dto) {
    try {
      if (!this.cs) this.createColumnSet();
      const qInsert = this.pgp.helpers.insert(dto, this.cs.insert);
      return await this.db.none(qInsert, dto);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * @method Model#select
   * @description Selects rows from the table.
   * @param {Object} [filters] - The filters to apply to the query.
   * @returns {Promise} A promise that resolves with the selected rows.
   *
   * @example
   * ...
   * const users = new Users(db, pgp);
   * const allUsers = await users.select();
   * const activeUsers = await users.select({ active: true });
   * ...
   */
  async select(dto) {
    try {
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
      }

      const qSelect =
        Object.keys(dto).length === 0 && dto.constructor === Object
          ? `SELECT * FROM ${this.schema.tableName};`
          : this.pgp.as.format(
              `SELECT $1:name FROM ${this.schema.tableName} ${condition};`,
              [dto]
            );

      return this.db.any(qSelect);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * @method Model#update
   * @description Updates rows in the table.
   * @param {Object} filters - The filters to apply to the query.
   * @param {Object} data - The data to update.
   * @returns {Promise} A promise that resolves when the rows are updated.
   * 
   * @example
   * ...
   * const users = new Users(db, pgp);
   * await users.update({ active: true }, { active: false });
   
   * const users = new Users(db, pgp);
   * await users.update({ email: '  [email protected] ' }, { full_name: 'John Doe' });
   * ...             
   */
  async update(dto) {
    try {
      if (!this.cs) this.createColumnSet();
      const condition = this.pgp.as.format(dto._condition, dto);
      const qUpdate = this.pgp.helpers.update(dto, this.cs.update) + condition;
      const result = await this.db.result(qUpdate, dto);

      if (result.rowcount === 0) {
        throw new Error('No rows updated'); // throw error if no rows updated;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * @method Model#delete
   * @description Deletes rows from the table.
   * @param {Object} filters - The filters to apply to the query.
   * @returns {Promise} A promise that resolves when the rows are deleted.
   */
  async delete(filters) {
    try {
      let condition = '';
      if (deleteDTO._condition) {
        condition = pgp.as.format(deleteDTO._condition, deleteDTO);
        delete deleteDTO._condition;
      } else {
        throw new Error('Delete requires a condition');
      } // end if deleteDTO._condition

      const qDelete = pgp.as.format(
        `DELETE FROM ${users.schema.tableName} ${condition};`,
        [deleteDTO]
      );

      return this.db.none(qDelete);
    } catch (error) {
      return Promise.reject(error);
    }
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

  /**
   * @method Model#createColumnSet
   * @description Creates the ColumnSet for the model.
   * @private
   * @returns {void}
   */
  createColumnSet() {
    if (!this.cs) {
      const columns = [];

      for (const column in this.schema.columns) {
        if (this.schema.columns.hasOwnProperty(column)) {
          const isPrimaryKey = this.schema.columns[column].primaryKey || false;
          const defaultValue = this.schema.columns[column].default || null;

          let columnObject = {
            name: column,
            prop: column,
          };
          isPrimaryKey
            ? (columnObject.cnd = true)
            : (columnObject.skip = (c) => !c.exists);
          defaultValue ? (columnObject.def = defaultValue) : null;
          columns.push(columnObject);
        }
      }

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

      this.cs = cs;
    }
  }
}

module.exports = Model;
