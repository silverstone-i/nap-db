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

class QueryBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.table = '';
    this.fields = '*';
    this.conditions = [];
    this.orderBy = '';
    this.limit = undefined;
    this.offset = undefined;
    this.joins = [];
    this.aggregates = [];
    this.groupBy = '';
    this.values = [];
  }

  setTable(table) {
    this.table = table;
    return this;
  }

  setFields(fields) {
    this.fields = Array.isArray(fields) ? fields.join(', ') : fields;
    return this;
  }

  addCondition(condition, value) {
    this.conditions.push(condition);
    this.values.push(value);
    return this;
  }

  setOrderBy(orderBy) {
    this.orderBy = orderBy;
    return this;
  }

  setLimit(limit) {
    this.limit = limit;
    return this;
  }

  setOffset(offset) {
    this.offset = offset;
    return this;
  }

  addJoin(type, table, condition) {
    this.joins.push({ type, table, condition });
    return this;
  }

  addAggregate(func, field, alias) {
    this.aggregates.push({ func, field, alias });
    return this;
  }

  setGroupBy(groupBy) {
    this.groupBy = groupBy;
    return this;
  }

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
    if (this.limit !== undefined && this.offset !== undefined) {
      query += ` LIMIT ? OFFSET ?`;
      this.values.push(this.limit, this.offset);
    }
    return query;
  }

  buildAggregateQuery() {
    const aggregateFields = this.aggregates
      .map((a) => `${a.func}(${a.field}) AS ${a.alias}`)
      .join(', ');
    let query = `SELECT ${aggregateFields} FROM ${this.table}`;
    if (this.groupBy) {
      query += ` GROUP BY ${this.groupBy}`;
    }
    return query;
  }

  addJoins(query) {
    this.joins.forEach((join) => {
      query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
    });
    return query;
  }

  addWhereClause(query) {
      if (this.conditions.length > 0) {
        const buildCondition = (condition) => {
          let clause;
          if (condition.operator === 'LIKE') {
            clause = `${condition.field} LIKE '${condition.value}'`;
          } else if (condition.operator === 'IN') {
            clause = `${condition.field} IN (${condition.value.join(', ')})`;
          } else if (condition.operator === 'BETWEEN') {
            clause = `${condition.field} BETWEEN ${condition.value[0]} AND ${condition.value[1]}`;
          } else if (
            condition.operator === 'IS NULL' ||
            condition.operator === 'IS NOT NULL'
          ) {
            clause = `${condition.field} ${condition.operator}`;
          } else {
            clause = `${condition.field} ${condition.operator} ${condition.value}`;
          }
          return clause;
        };

        const processGroup = (group) => {
          if (Array.isArray(group[0])) {
            const nestedClauses = group.map((nestedGroup) =>
              processGroup(nestedGroup)
            );
            return `(${nestedClauses.join(` ${group.conjunction || 'AND'} `)})`;
          } else {
            const clauses = group.map((item) => buildCondition(item));
            return clauses.join(` ${group.conjunction || 'AND'} `);
          }
        };

        const whereClause = processGroup(this.conditions);
        query += ' WHERE ' + whereClause;
      }
      return query;
    }
}

module.exports = QueryBuilder;
