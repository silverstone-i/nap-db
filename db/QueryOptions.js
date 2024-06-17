'./db/QueryOptions.js';

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

/**
 * QueryOptions class to manage and validate query parameters for database operations.
 *
 * @class QueryOptions
 * @property {string} table - The table name for the query.
 * @property {string|string[]} fields - The fields to select.
 * @property {Array} conditions - Array to store query conditions.
 * @property {string} orderBy - The ORDER BY clause.
 * @property {number} limit - The LIMIT clause.
 * @property {number} offset - The OFFSET clause.
 * @property {Array} joins - Array to store JOIN clauses.
 * @property {Array} aggregates - Array to store aggregate functions.
 * @property {string} groupBy - The GROUP BY clause.
 * @property {Array} values - Array to store parameterized values for prepared statements.
 * @property {boolean} includeTimestamps - Flag to include timestamps in the query.
 */
class QueryOptions {
  constructor() {
    this.reset();
  }

  /**
   * Returns an object containing the query options.
   * @returns {Object} - The query options object.
   * @memberof QueryOptions
   */
  get Options() {
    const options = {
      table: this.table,
      fields: this.fields,
      conditions: this.conditions,
      orderBy: this.orderBy,
      limit: this.limit,
      offset: this.offset,
      joins: this.joins,
      aggregates: this.aggregates,
      groupBy: this.groupBy,
      values: this.values,
      includeTimestamps: this.includeTimestamps,
    };

    return options;
  }

  /**
   * Validates and sets various query parameters for the QueryOptions instance.
   * @param {Object} options - An object containing query parameters.
   * @returns {QueryOptions} - The QueryOptions instance with updated properties.
   * @throws {DBError} - If the options object is invalid.
   * @memberof QueryOptions
   */
  set Options(options) {
    try {
      if (
        !options ||
        typeof options !== 'object' ||
        Array.isArray(options) ||
        Object.keys(options).length === 0
      ) {
        throw new Error('Invalid options object.');
      }

      const {
        table,
        fields,
        conditions,
        orderBy,
        limit,
        offset,
        joins,
        aggregates,
        groupBy,
        values,
        includeTimestamps,
      } = options;

      if (table) this.setTable(table);
      if (fields) this.setFields(fields);
      if (conditions && conditions.length > 0)
        conditions.forEach((condition) => this.addCondition(condition));
      if (orderBy) this.setOrderBy(orderBy);
      if (limit) this.setLimit(limit);
      if (offset) this.setOffset(offset);
      if (joins && joins.length > 0)
        joins.forEach((join) =>
          this.addJoin(join.type, join.table, join.condition)
        );
      if (aggregates && aggregates.length > 0)
        aggregates.forEach((aggregate) =>
          this.addAggregate(aggregate.func, aggregate.field, aggregate.alias)
        );
      if (groupBy) this.setGroupBy(groupBy);
      if (values) this.addValue(values);
      if (includeTimestamps) this.includeTimestamps = includeTimestamps;

      return this;
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Set of valid aggregate functions.
   * @type {Set<string>}
   * @static
   * @memberof QueryOptions
   */
  static validAggregateFunctions = new Set([
    'COUNT',
    'MAX',
    'MIN',
    'SUM',
    'VARIANCE',
    'STDDEV',
    'MEDIAN',
    'AVG',
    'STRING_AGG',
    'FIRST_VALUE',
    'LAST_VALUE',
  ]);

  /**
   * Checks if an aggregate function name is valid.
   * @param {string} func - The aggregate function name to validate.
   * @returns {boolean} True if the function name is valid, otherwise false.
   * @static
   * @memberof QueryOptions
   */
  static isValidAggregateFunction(func) {
    // Convert the function name to uppercase for case insensitivity
    const upperCaseFunc = func.toUpperCase();
    // Check if the uppercase function name exists in the set of valid functions
    return QueryOptions.validAggregateFunctions.has(upperCaseFunc);
  }

  /**
   * Resets the query options to their default values.
   * @memberof QueryOptions
   */
  reset() {
    this.table = ''; // The table name for the query
    this.fields = '*'; // The fields to select (default is all fields)
    this.conditions = []; // Array to store query conditions
    this.orderBy = ''; // The ORDER BY clause
    this.limit = undefined; // The LIMIT clause
    this.offset = undefined; // The OFFSET clause
    this.joins = []; // Array to store JOIN clauses
    this.aggregates = []; // Array to store aggregate functions
    this.groupBy = ''; // The GROUP BY clause
    this.values = []; // Array to store parameterized values for prepared statements
    this.includeTimestamps = false; // Flag to include timestamps in the query
  }

  /**
   * Sets the table for the query.
   * @param {string} table - The name of the table.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the table name is invalid.
   * @memberof QueryOptions
   */
  setTable(table) {
    try {
      if (!table || typeof table !== 'string' || table === '') {
        throw new Error('Invalid table name.');
      } else {
        this.table = table;
        return this;
      }
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Sets the fields to select.
   * @param {string|string[]} fields - The fields to select.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the field(s) are invalid.
   * @memberof QueryOptions
   */
  setFields(fields) {
    try {
      if (!fields || (typeof fields !== 'string' && !Array.isArray(fields))) {
        throw new Error('Invalid field(s).');
      } else {
        this.fields = Array.isArray(fields) ? fields.join(', ') : fields;
        return this;
      }
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Adds a condition to the query.
   * @param {object|object[]} condition - The condition(s) to add.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the condition(s) are invalid.
   * @memberof QueryOptions
   * @example
   * // Single condition
   * queryOptions.addCondition({ field: 'id', operator: '=', value: 1});
   *
   * @example
   * // Nested conditions
   *  qb.setTable('users')
   *   .setFields(['age', 'gender', 'city'])
   *  .addCondition({ field: 'age', operator: '>', value: 18 })
   *    .addCondition({ field: 'gender', operator: '=', value: 'male' })
   *     .addCondition([
   *      { field: 'city', operator: '=', value: 'New York' },
   *       {
   *         conjunction: 'OR',
   *         field: 'city',
   *         operator: '=',
   *         value: 'Los Angeles',
   *       },
   *     ]);
   *
   *    console.log(qb.buildQuery());  // { query: 'SELECT age, gender, city FROM users WHERE age > $1 AND gender = $2 AND (city = $3 OR city = $4)', values: [18, 'male', 'New York', 'Los Angeles'] }
   */
  addCondition(condition) {
    try {
      if (
        !condition ||
        (typeof condition !== 'object' && !Array.isArray(condition))
      ) {
        throw new Error('Invalid condition(s).');
      }

      this.conditions.push(condition);
      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Sets the ORDER BY clause for the query.
   * @param {string} orderBy - The ORDER BY clause.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the ORDER BY clause is invalid.
   *  @memberof QueryOptions
   */
  setOrderBy(orderBy) {
    try {
      if (!orderBy || typeof orderBy !== 'string') {
        throw new Error('Invalid ORDER BY clause.');
      }
      this.orderBy = orderBy;
      return this;
    } catch (error) {
      throw new DBError(error.message);
    }
  }

  /**
   * Sets the LIMIT clause for the query.
   * @param {number} limit - The LIMIT value.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the LIMIT value is invalid.
   * @memberof QueryOptions
   */
  setLimit(limit) {
    try {
      if (typeof limit !== 'number') {
        throw new Error('Invalid limit value.');
      }

      if (limit < 10) {
        limit = 10;
      }

      this.limit = limit;
      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Sets the OFFSET clause for the query.
   * @param {number} offset - The OFFSET value.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the OFFSET value is invalid.
   * @memberof QueryOptions
   */
  setOffset(offset) {
    this.offset = offset;
    return this;
  }

  /**
   * Adds a JOIN clause to the query.
   * @param {string} type - The type of join (e.g., 'INNER', 'LEFT', 'RIGHT').
   * @param {string} table - The name of the table to join.
   * @param {string} condition - The join condition.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the join parameters are invalid.
   * @memberof QueryOptions
   *
   * @example
   * qb.setTable('users')
   *  .setFields(['name', 'email', 'city'])
   * .addJoin('LEFT', 'addresses', 'users.id = addresses.user_id')
   * .addCondition({ field: 'city', operator: '=', value: 'New York' });
   *
   * console.log(qb.buildQuery());  // { query: 'SELECT name, email, city FROM users LEFT JOIN addresses ON users.id = addresses.user_id WHERE city = $1', values: ['New York'] }
   */
  addJoin(type, table, condition) {
    try {
      if (
        !type ||
        !table ||
        !condition ||
        typeof type !== 'string' ||
        typeof table !== 'string' ||
        typeof condition !== 'string'
      ) {
        const missing =
          !type || typeof type !== 'string'
            ? 'join type'
            : !table || typeof table !== 'string'
            ? 'join table'
            : 'join condition';
        throw new Error(`Invalid ${missing}.`);
      }

      this.joins.push({ type, table, condition });
      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Adds an aggregate function to the query.
   * @param {string} func - The aggregate function (e.g., 'COUNT', 'SUM', 'AVG').
   * @param {string} field - The field to which the function is applied.
   * @param {string} alias - The alias for the aggregated value.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the aggregate parameters are invalid.
   *  @memberof QueryOptions
   *
   * @example
   * qb.setTable('users')
   * .addAggregate('COUNT', 'id', 'total_users')
   * .addAggregate('AVG', 'age', 'average_age');
   *
   * console.log(qb.buildQuery());  // { query: 'SELECT COUNT(id) AS total_users, AVG(age) AS average_age FROM users', values: [] }
   */
  addAggregate(func, field, alias) {
    try {
      if (
        !func ||
        typeof func !== 'string' ||
        !field ||
        typeof field !== 'string' ||
        !alias ||
        typeof alias !== 'string'
      ) {
        const missing =
          !func || typeof func !== 'string'
            ? 'function'
            : !field || typeof field !== 'string'
            ? 'field'
            : 'alias';
        throw new Error(`Invalid ${missing}.`);
      } else if (!QueryOptions.isValidAggregateFunction(func)) {
        throw new Error('Invalid aggregate function name.');
      } else {
        this.aggregates.push({ func, field, alias });
        return this;
      }
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Sets the GROUP BY clause for the query.
   * @param {string} groupBy - The GROUP BY clause.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the GROUP BY clause is invalid.
   * @memberof QueryOptions
   */
  setGroupBy(groupBy) {
    try {
      if (!groupBy || typeof groupBy !== 'string') {
        throw new Error('Invalid GROUP BY clause.');
      }
      this.groupBy = groupBy;
      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Adds a value to the list of parameterized values for prepared statements.
   * @param {*} value - The value to add.
   * @returns {QueryOptions} - The QueryOptions instance for method chaining.
   * @throws {DBError} - If the value is invalid.
   * @memberof QueryOptions
   */
  addValue(value) {
    try {
      if (value === undefined || value === null) {
        throw new Error('Invalid value.');
      }

      if (Array.isArray(value)) {
        this.values.push(...value);
      } else {
        this.values.push(value);
      }

      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }
}

module.exports = QueryOptions;
