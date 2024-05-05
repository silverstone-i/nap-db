// .db/Model.js
'use strict';

const { DBError } = require('./errors');

class Model {
  static csCounter = 0;
  constructor(db, pgp, schema) {
    this.db = db;
    this.pgp = pgp;
    if (!schema.dbSchema) schema.dbSchema = 'public';
    if (!schema.timeStamps) schema.timeStamps = true;
    this.schema = JSON.parse(JSON.stringify(schema));
    this.csCount = 0;
    this.cs = this.createColumnSet();
    console.log('Model initialized', this.cs !== null);
  }

  get columnset() {
    return this.cs;
  }

  async init() {
    // const query = this._createTableQuery();
    // console.log('Query:', query);

    await this.db.none(this._createTableQuery());
  }

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

  async drop() {
    await this.db.none(`DROP TABLE IF EXISTS ${this.schema.tableName};`);
  }

  async insert(dto) {
    console.log('Inserting:', dto);

    try {
      if (!this.cs) this.createColumnSet();
      const qInsert = this.pgp.helpers.insert(dto, this.cs.insert);
      console.log('Query:', qInsert);
      return await this.db.none(qInsert, dto);
    } catch (error) {
      console.log('Error:', error);

      throw new DBError(error);
    }
  }

  async select(dto) {
    try {
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
      }

      const qSelect =
        Object.keys(dto).length === 0 && dto.constructor === Object
          ? `SELECT * FROM ${this.schema.tableName} ${condition};`
          : this.pgp.as.format(
              `SELECT $1:name FROM ${this.schema.tableName} ${condition};`,
              [dto]
            );

      console.log('Query:', qSelect);

      return this.db.any(qSelect);
    } catch (error) {
      throw new DBError(error);
    }
  }

  async update(dto) {
    try {
      if (!this.cs) this.createColumnSet();
      const condition = this.pgp.as.format(dto._condition, dto);
      const qUpdate = this.pgp.helpers.update(dto, this.cs.update) + condition;
      const result = await this.db.result(qUpdate, dto);

      if (result.rowcount === 0) {
        throw new Error('No rows updated');
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete(dto) {
    try {
      let condition = '';
      if (dto._condition) {
        condition = this.pgp.as.format(dto._condition, dto);
        delete dto._condition;
      } else {
        throw new Error('Delete requires a condition');
      }

      const qDelete = this.pgp.as.format(
        `DELETE FROM ${this.schema.tableName} ${condition};`,
        [dto]
      );

      return this.db.none(qDelete);
    } catch (error) {
      throw error;
    }
  }

  async truncate() {
    return this.db.none(`TRUNCATE TABLE ${this.schema.tableName};`);
  }

  async count() {
    return this.db.one(
      `SELECT COUNT(*) FROM ${this.schema.tableName};`,
      [],
      (a) => +a.count
    );
  }

  createColumnSet() {
    if (!this.cs) {
      console.log('Creating column set', ++Model.csCounter);

      const columns = Object.keys(this.schema.columns)
        .map((column) => {
          const isPrimaryKey = this.schema.columns[column].primaryKey || false;
          const defaultValue = this.schema.columns[column].default || null;
          if (this.schema.columns[column].type === 'serial') return null; // ignore serial columns

          let columnObject = {
            name: column,
            prop: column,
          };
          isPrimaryKey
            ? (columnObject.cnd = true)
            : (columnObject.skip = (c) => !c.exists);
          defaultValue ? (columnObject.def = defaultValue) : null;
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
  }
}

module.exports = Model;
