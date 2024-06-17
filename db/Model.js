'./db/Model.js';

/*
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

class Model extends SelectQueryBuilder {
  constructor(db, pgp, schema) {
    super();
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
  async findAll(options) {
    try {
      this.reset();
      options.table = this.schema.tableName;
      this.Options = options;
      const { query, values } = this.buildQuery();
      return await this.db.manyOrNone(query, values);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  _addTotalCountToQuery(query) {
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
    } else {
      // If FROM clause not found, append the total count string to the end of the query
      return `${query.trim()}, ${totalCountString}`;
    }
  }

  /**
   * Fetches all records from the database table and returns the total count of records
   * @param {Object} options - {@link QueryOptions}
   * @returns {Promise} - Returns a promise that resolves with the records and total count
   * @throws {DBError} - Failed to fetch records
   *
   * @example
   *
   * qo.setTable('table_name')
   *   .setFields('field1, field2')
   *   .addCondition({ field: 'field1', operator: '=', value: 'value1' })
   *   .setOrderBy('field1 ASC')
   *   .setLimit(10)
   *   .setOffset(5)
   *   .addJoin('INNER', 'table2', 'table1.id = table2.id')
   *   .addAggregate('COUNT', 'name', 'count')
   *   .setGroupBy('field1');
   *
   */
  async findAndCountAll(options) {
    try {
      this.reset();
      options.table = this.schema.tableName;
      this.Options = options;
      const { query, values } = this.buildQuery();

      if (!query.includes(' FROM ')) {
        throw new Error('FROM clause not found in query.');
      }

      const totalCountQuery = this._addTotalCountToQuery(query);
      return await this.db.manyOrNone(totalCountQuery, values);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  findByPK(pkValue, options = {}) {
    try {
      if (pkValue === undefined || pkValue === null) {
        throw new Error('Primary key is required.');
      }

      const { includeTimestamps = false } = options;

      const timestampFields = [
        'created_at',
        'created_by',
        'updated_at',
        'updated_by',
      ];
      const columns = includeTimestamps
        ? '*'
        : Object.keys(this.schema.columns)
            .filter((column) => !timestampFields.includes(column))
            .join(', ');

      const query = `SELECT ${columns} FROM ${this.schema.tableName} WHERE ${this.schema.primaryKey} = $1;`;
      return this.db.oneOrNone(query, pkValue);
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Finds a single record in the database based on the provided options.
   * @param {Object} options - The options for the query.
   * @returns {Promise<Object|null>} - A promise that resolves to the found record or null if not found.
   * @throws {DBError} - If an error occurs during the database operation.
   */
  async findOne(options) {
    try {
      this.reset();
      options.table = this.schema.tableName;
      this.Options = options;
      const { query, values } = this.buildQuery();
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
  // *******************************Aggregates********************************************

  async aggregate(options) {
    try {
      this.reset();
      options.table = this.schema.tableName;
      this.Options = options;
      const { query, values } = this.buildQuery();

      return await this.db.oneOrNone(query, values);
    } catch (error) {
      // console.log('Error:', error);
      throw new DBError(error.message);
    }
  }

  async count(options) {
    return await this.aggregate(options);
  }

  async max(options) {
    return await this.aggregate(options);
  }

  async min(options) {
    return await this.aggregate(options);
  }

  async sum(options) {
    return await this.aggregate(options);
  }

  async variance(options) {
    return await this.aggregate(options);
  }

  async stddev(options) {
    return await this.aggregate(options);
  }

  async median(options) {
    return await this.aggregate(options);
  }

  async average(options) {
    return await this.aggregate(options);
  }

  async stringAgg(options) {
    return await this.aggregate(options);
  }
  å;
  async firstValue(options) {
    return await this.aggregate(options);
  }

  async lastValue(options) {
    return await this.aggregate(options);
  }
}

module.exports = Model;
