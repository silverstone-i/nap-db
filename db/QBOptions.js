'./db/QBOptions.js';

/**
 *
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

class QBOptions {
  constructor() {
        this.dto = {};
        this.table = '';
        this.fields = '*';
        this.conditions = [];
        this.orderBy = '';
        this.limit = undefined;
        this.offset = undefined;
        this.joins = [];
        this.aggregates = [];
        this.groupBy = '';
  }

  setOptions(options) {
    this.dto = options.dto;
    this.table = options.table;
    this.fields = options.fields;
    this.conditions = options.conditions;
    this.orderBy = options.orderBy;
    this.limit = options.limit;
    this.offset = options.offset;
    this.joins = options.joins;
    this.aggregates = options.aggregates;
    this.groupBy = options.groupBy;
    return this;
  }

  setTable(table) {
    this.table = table;
    return this;
  }

  setFields(fields) {
    this.fields = Array.isArray(fields) ? fields.join(', ') : fields;
    return this;
  }

  addCondition(condition) {
    this.conditions.push(condition);
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
}

module.exports = QBOptions;