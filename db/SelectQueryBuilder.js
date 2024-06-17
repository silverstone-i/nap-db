'./db/SelectQueryBuilder.js';

/*
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const QueryOptions = require('./QueryOptions');

/**
 * Represents a query builder for constructing SELECT queries.
 * @extends QueryOptions
 */
class SelectQueryBuilder extends QueryOptions {
  /**
   * Represents a SelectQueryBuilder.
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Builds the query based on the specified table, aggregates, and values.
   * @returns {Object} An object containing the built query and the associated values.
   * @throws {Error} If no table is set.
   * @throws {Error} If an error occurs while building the query.
   *
   * @example
   *
   * const queryBuilder = new SelectQueryBuilder();
   * queryBuilder.setTable('users')
   *      .setFields('id, name, email')
   *      .addCondition({ field: 'id', operator: '=', value: 1)
   *      .addCondition({ conjunction: 'OR', field: 'name', operator: 'LIKE', value: '%John%' });
   *
   * const { query, values } = queryBuilder.buildQuery();
   * console.log(query); // SELECT id, name, email FROM users WHERE id = $1 OR name LIKE $2
   * console.log(values); // [1, '%John%']
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
   * Builds and returns the SELECT query based on the current state of the SelectQueryBuilder.
   * @returns {string} The generated SELECT query.
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
   * Builds and returns the aggregate query based on the specified aggregates, table, conditions, group by, order by, limit, and offset.
   * @returns {string} The aggregate query.
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
   * Adds joins to the query.
   *
   * @param {string} query - The query to add joins to.
   * @returns {string} The updated query with joins added.
   */
  addJoins(query) {
    this.joins.forEach((join) => {
      query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
    });
    return query;
  }

  /**
   * Adds a WHERE clause to the query based on the specified conditions.
   * @param {string} query - The original query string.
   * @returns {string} The modified query string with the WHERE clause added.
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
