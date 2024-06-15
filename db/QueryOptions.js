'./db/QueryOptions.js';


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

class QueryOptions {
  constructor() {
     this.reset();
  }

  get Options() {
    return {
      table: this.table,
      fields: this.fields,
      conditions: this.conditions,
      orderBy: this.orderBy,
      limit: this.limit,
      offset: this.offset,
      joins: this.joins,
      aggregates: this.aggregates,
      groupBy: this.groupBy,
    };
  }

  set Options(options) {
    try {
      if (!options || typeof options !== 'object') {
        throw new Error('Invalid options object.');
      }
      if (options.table) this.setTable(options.table);
      if (options.fields) this.setFields(options.fields);
      console.log('SET CONDITIONS');
      
      if (options.conditions && options.conditions.length > 0)
        options.conditions.forEach((condition) => {
          this.addCondition(condition);
        });
        console.log('CONDITIONS', this.conditions);
        
      if (options.orderBy) this.setOrderBy(options.orderBy);
      if (options.limit) this.setLimit(options.limit);
      if (options.offset) this.setOffset(options.offset);
      console.log('SET JOINS');
      
      if (options.joins && options.joins.length > 0)
        options.joins.forEach((join) => {
          this.addJoin(join.type, join.table, join.condition);
        });
        console.log('JOINS', this.joins);
        console.log('SET AGGREGATES', options.aggregates);
        
      if (options.aggregates && options.aggregates.length > 0)
        options.aggregates.forEach((aggregate) => {
          this.addAggregate(aggregate.func, aggregate.field, aggregate.alias);
        });
        console.log('AGGREGATES', this.aggregates);
      if (options.groupBy) this.setGroupBy(options.groupBy);
      return this;
    } catch (error) {
      // console.error(error);
      throw new DBError(error.message);
    }
  }

  /**
   * Set of valid aggregate functions.
   * @type {Set<string>}
   * @static
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
    'FIRSTVALUE',
    'LASTVALUE',
  ]);

  /**
   * Checks if an aggregate function name is valid.
   * @param {string} func - The aggregate function name to validate.
   * @returns {boolean} True if the function name is valid, otherwise false.
   * @static
   */
  static isValidAggregateFunction(func) {
    // Convert the function name to uppercase for case insensitivity
    const upperCaseFunc = func.toUpperCase();
    // Check if the uppercase function name exists in the set of valid functions
    return QueryOptions.validAggregateFunctions.has(upperCaseFunc);
  }

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
  }

  /**
   * Sets the table for the query.
   * @param {string} table - The name of the table.
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
   */
  setTable(table) {
    try {
      if (!table || typeof table !== 'string') {
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
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
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
   * @param {*} [value] - The value to compare against (for single condition).
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
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
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
   */
  setOrderBy(orderBy) {
    this.orderBy = orderBy;
    return this;
  }

  /**
   * Sets the LIMIT clause for the query.
   * @param {number} limit - The LIMIT value.
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
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
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
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
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
   */
  addJoin(type, table, condition) {
    this.joins.push({ type, table, condition });
    return this;
  }

  /**
   * Adds an aggregate function to the query.
   * @param {string} func - The aggregate function (e.g., 'COUNT', 'SUM', 'AVG').
   * @param {string} field - The field to which the function is applied.
   * @param {string} alias - The alias for the aggregated value.
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
   */
  addAggregate(func, field, alias) {
    try {
      if (!func || !field || !alias) {
        const missing = !func ? 'function' : !field ? 'field' : 'alias';
        throw new Error(`Invalid ${missing}.`);
      } else if (!QueryOptions.isValidAggregateFunction(func)) {
        throw new Error('Invalid aggregate function name.');
      } else {
        console.log('{ func: ', func, 'field: ', field, 'alias: ', alias, '}');
        console.log('this.aggregates:', this.aggregates);
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
   * @returns {SelectQueryBuilder} - The SelectQueryBuilder instance for method chaining.
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
}

module.exports = QueryOptions;
