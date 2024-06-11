'./db/QueryBuilder.js';

/**
 *
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const DB = require('./DB');
const { DBError } = require('./errors');

/**
 * Represents a builder for constructing SELECT queries dynamically.
 */
class SelectQueryBuilder {
  /**
   * Creates a new instance of SelectQueryBuilder.
   */
  constructor() {
    this.reset();
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
    'STRINGAGG',
    'FIRSTVALUE',
    'LASTVALUE',
  ]);

  /**
   * Checks if an aggregate function name is valid.
   * @param {string} func - The aggregate function name to validate.
   * @returns {boolean} True if the function name is valid, otherwise false.
   * @static
   */
  static isAggregateFunctionValid(func) {
    // Convert the function name to uppercase for case insensitivity
    const upperCaseFunc = func.toUpperCase();
    // Check if the uppercase function name exists in the set of valid functions
    return SelectQueryBuilder.validAggregateFunctions.has(upperCaseFunc);
  }

  /**
   * Resets all query builder properties to their default values.
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
      } else if (!SelectQueryBuilder.isAggregateFunctionValid(func)) {
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

  /**
   * Builds the SQL query based on the query builder properties.
   * @returns {object} - An object containing the built query and parameterized values.
   */
  /**
   * Builds the SQL query based on the query builder properties.
   * @returns {object} - An object containing the built query and parameterized values.
   */
  buildQuery() {
    let query = '';
    try {
      if (!this.table) {
        throw new Error('No table set');
      }
      if (this.aggregates.length > 0) {
        query = this.buildAggregateQuery();
      } else {
        query = this.buildSelectQuery();
      }
      return { query, values: this.values };
    } catch (error) {
      // console.log({ ReferenceError: error });
      throw error.message;
    }
  }

  /**
   * Builds a SELECT query based on the query builder properties.
   * @returns {string} - The built SELECT query.
   */
  buildSelectQuery() {
    let query = `SELECT ${this.fields} FROM ${this.table}`;
    if (this.joins.length > 0) {
      query = this.addJoins(query);
    }
    if (this.conditions.length > 0) {
      query = this.addWhereClause(query);
    }
    if (this.groupBy) {
      query += ` GROUP BY ${this.groupBy}`;
    }
    if (this.orderBy) {
      query += ` ORDER BY ${this.orderBy}`;
    }
    if (this.limit !== undefined) {
      query += ` LIMIT ${this.limit}`;
    }
    if (this.offset !== undefined) {
      query += ` OFFSET ${this.offset}`;
    }

    return query;
  }

  /**
   * Builds an aggregate query based on the query builder properties.
   * @returns {string} - The built aggregate query.
   */
  buildAggregateQuery() {
    const aggregateFields = this.aggregates
      .map((a) => `${a.func}(${a.field}) AS ${a.alias}`)
      .join(', ');
    let query = `SELECT ${aggregateFields} FROM ${this.table}`;
    if (this.conditions.length > 0) {
      query = this.addWhereClause(query);
    }
    if (this.groupBy) {
      query += ` GROUP BY ${this.groupBy}`;
    }
    if (this.orderBy) {
      query += ` ORDER BY ${this.orderBy}`;
    }
    if (this.limit !== undefined) {
      query += ` LIMIT ${this.limit}`;
    }
    if (this.offset !== undefined) {
      query += ` OFFSET ${this.offset}`;
    }

    return query;
  }

  /**
   * Adds JOIN clauses to the query string.
   * @param {string} query - The query string to which JOIN clauses will be added.
   * @returns {string} - The query string with JOIN clauses added.
   */
  addJoins(query) {
    this.joins.forEach((join) => {
      query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
    });
    return query;
  }

  /**
   * Generate SQL WHERE string based on ConditionsObject
   * @param {ConditionsObject} conditionsObj - The ConditionsObject containing conditions for WHERE clause.
   * @returns {string} - SQL WHERE string.
   */
  addWhereClause(query) {
    query += ' WHERE ';

    // Define a counter for parameter numbering
    let parameterCounter = this.values.length + 1;

    const buildCondition = (condition) => {
      let clause;
      if (condition.operator === 'LIKE') {
        clause = `${condition.field} LIKE $${parameterCounter}`;
        this.values.push(condition.value);
        parameterCounter++; // Increment counter
      } else if (
        condition.operator === 'IN' ||
        condition.operator === 'NOT IN'
      ) {
        const placeholders = condition.value
          .map(() => `$${parameterCounter++}`)
          .join(', ');
        clause = `${condition.field} ${condition.operator} (${placeholders})`;
        this.values.push(...condition.value);
      } else if (
        condition.operator === 'BETWEEN' ||
        condition.operator === 'NOT BETWEEN'
      ) {
        clause = `${condition.field} ${
          condition.operator
        } $${parameterCounter++} AND $${parameterCounter++}`;
        this.values.push(...condition.value);
      } else if (
        condition.operator === 'IS NULL' ||
        condition.operator === 'IS NOT NULL'
      ) {
        clause = `${condition.field} ${condition.operator}`;
      } else {
        clause = `${condition.field} ${
          condition.operator
        } $${parameterCounter++}`;
        this.values.push(condition.value);
      }

      return clause;
    };

    const processConditions = (conditions) => {
      let clause = '';
      conditions.forEach((condition, index) => {
        if (index !== 0) {
          clause += ` ${condition.conjunction || 'AND'} `;
        }
        if (Array.isArray(condition)) {
          clause += `(${processConditions(condition)})`;
        } else {
          clause += buildCondition(condition);
        }
      });
      return clause;
    };

    return query + processConditions(this.conditions);
  }
}

module.exports = SelectQueryBuilder;
