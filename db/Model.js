// './db/Model.js';

/**
 *
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const { DBError } = require('./errors');
const SelectQueryBuilder = require('./SelectQueryBuilder');

class Model {
  constructor(db, pgp, schema) {
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
      this.cs = this.createColumnSet();
      this.qb = new SelectQueryBuilder();
  }

  // ************************************Getters and Setters************************************
  get columnset() {
    return this.cs;
  }
  //  Returns the column set object for the model

  // ***********************************Private Helper Functions***********************************
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
        table: {
          table: this.schema.tableName,
          schema: this.schema.dbSchema,
        },
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

  #generateConstraints(constraints) {
    return Object.entries(constraints)
      .map(([name, config]) => `CONSTRAINT ${name} ${config}`)
      .join(',\n');
  }

  #generateIndexes(tableName, indexes) {
    return Object.entries(indexes)
      .map(([indexName, { unique, config }]) => {
        const uniqueClause = unique ? 'UNIQUE ' : '';
        return `CREATE ${uniqueClause}INDEX ${indexName} ON ${tableName} (${config});`;
      })
      .join('\n');
  }

  // **************************CREATE TABLE*******************************************
  async createTable() {
    try {
      return await this.db.none(this.createTableQuery());
    } catch (err) {
      throw new DBError('Failed to create table.', err.message);
    }
  }

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

  // **************************CRUD Operations*******************************************
  async insert(dto) {
    try {
      const qInsert = this.pgp.helpers.insert(dto, this.cs.insert);
      return await this.db.none(qInsert, dto);
    } catch (error) {
      throw new DBError(error.message);
    }
  }
  async insertReturning(dto) {
    try {
      const returning = dto.returning || 'RETURNING *';
      delete dto.returning;
      const qInsert =
        this.pgp.helpers.insert(dto, this.cs.insert) + ' ' + returning;

      const result = await this.db.one(qInsert, dto);
      return result;
    } catch (error) {
      // console.log('Error:', error);

      throw new DBError(error.message);
    }
  }
  //    Fetches all records from the database table
  async findAll(options) {
    try {
      this.qb.reset();
      options.table = this.schema.tableName;
      this.qb.Options = options;
      const { query, values } = this.qb.build();
      return await this.db.manyOrNone(query, values);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  #addTotalCountToQuery(query) {
    const totalCountString = 'COUNT(*) OVER() AS total_count';
    if (query.toUpperCase().includes(totalCountString.toUpperCase())) {
      // If 'COUNT(*) OVER() AS total_count' already exists, return the original query
      return query;
    }

    const fromIndex = query.toUpperCase().indexOf('FROM');
    if (fromIndex !== -1) {
      // Insert the total count string before the FROM clause
      const beforeFrom = query.substring(0, fromIndex);
      const afterFrom = query.substring(fromIndex);
      return `${beforeFrom.trim()}, ${totalCountString} ${afterFrom}`;
    }

    // If 'FROM' not found, return the original query
    return query;
  }

  /**
   *
   * @param {*} options
   * @returns
   */
  async findAndCountAll(options) {
    try {
      this.qb.reset();
      options.table = this.schema.tableName;
      this.qb.Options = options;
      const { query, values } = this.qb.build();
      const totalCountQuery = this.#addTotalCountToQuery(query);
      return await this.db.manyOrNone(totalCountQuery, values);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  //    Finds a record by its primary key
  findByPK(pkValue) {
    try {
      return this.db.oneOrNone(
        `SELECT * FROM ${this.schema.tableName} WHERE ${this.schema.primaryKey} = $1;`,
        pkValue
      );
    } catch (error) {
      // console.log('Error:', error);
      throw new DBError(error.message);
    }
  }

  //   Finds a single record based on provided conditions

  async findOne(options) {
    try {
      this.qb.reset();
      options.table = this.schema.tableName;
      this.qb.Options = options;
      const { query, values } = this.qb.build();
      return await this.db.oneOrNone(query, values);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

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

  // **************************Other Query Operations*******************************************
  async drop() {
    try {
      return await this.db.none(`DROP TABLE ${this.schema.tableName};`);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  async truncate() {
    try {
      return await this.db.none(`TRUNCATE TABLE ${this.schema.tableName};`);
    } catch (error) {
      throw new DBError(error.message);
    }
  }
  async runQuery() {} //    Runs a custom query on the database

  // *******************************Aggregates********************************************

  async aggregate(options) {
    try {
      this.qb.reset();
      options.table = this.schema.tableName;
      this.qb.Options = options;
      const { query, values } = this.qb.buildQuery();
      
      return await this.db.oneOrNone(query, values);
    } catch (error) {
      // console.log('Error:', error);
      throw new DBError(error.message);
    }
  }

  async count(options) {
    return await this.aggregate(options);
  }

  //    Finds the maximum value for a given field
  async max(options) {
    return await this.aggregate(options);
  }

  //    Finds the minimum value for a given field
  async min(options) {
    return await this.aggregate(dto);
  }

  //    Calculates the sum of a given field
  async sum(options) {
    return await this.aggregate(options);
  }

  //   Finds the variance for a given field
  async variance(options) {
    return await this.aggregate(options);
  }

  //    Finds the standard deviation for a given field
  async stddev(options) {
    return await this.aggregate(options);
  }

  //    Finds the median for a given field
  async median(options) {
    return await this.aggregate(options);
  }

  //   Calculates the average of a given field
  async average(options) {
    return await this.aggregate(options);
  }

  //    Concatenates strings from multiple records into one string with specified delimiter
  async stringAgg(options) {
    return await this.aggregate(options);
  }

  // Finds the first value for a given field
  async firstValue(options) {
    return await this.aggregate(options);
  }

  //    Finds the last value for a given field
  async lastValue(options) {
    return await this.aggregate(options);
  }
}

module.exports = Model;

// new dto = {
// 		values:{}
// 		options: {}
// {
