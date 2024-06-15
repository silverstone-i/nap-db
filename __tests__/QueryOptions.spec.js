'./__tests__/QueryOptions.spec.js';

/**
 *
 * Copyright © 2024-present, Ian Silverstone
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const QueryOptions = require('../db/QueryOptions');

describe('QueryOptions', () => {
  let qo;

  beforeEach(() => {
    qo = new QueryOptions();
  });

  afterEach(() => {
    qo.reset();
  });

  describe('constructor', () => {
    it('should create a new instance of QueryOptions', () => {
      expect(qo).toBeInstanceOf(QueryOptions);
    });

    it('should set default values for all fields', () => {
      expect(qo).toEqual({
        table: '',
        fields: '*',
        conditions: [],
        orderBy: '',
        limit: undefined,
        offset: undefined,
        joins: [],
        aggregates: [],
        groupBy: '',
        values: [],
      });
    });
  });

  describe('reset', () => {
    it('should reset all fields to their default values', () => {
      qo.table = 'table_name';
      qo.fields = 'field1, field2';
      qo.conditions = [{ field: 'field1', operator: '=', value: 'value1' }];
      qo.orderBy = 'field1 ASC';
      qo.limit = 10;
      qo.offset = 5;
      qo.joins = [
        {
          type: 'INNER JOIN',
          table: 'table2',
          condition: 'table1.id = table2.id',
        },
      ];
      qo.aggregates = [{ func: 'COUNT', field: 'name', alias: 'count' }];
      qo.groupBy = 'field1';

      qo.reset();

      expect(qo).toEqual({
        table: '',
        fields: '*',
        conditions: [],
        orderBy: '',
        limit: undefined,
        offset: undefined,
        joins: [],
        aggregates: [],
        groupBy: '',
        values: [],
      });
    });

    describe('getOptions', () => {
      it('should return an object with all query options', () => {
        qo.setTable('table_name')
          .setFields('field1, field2')
          .addCondition({ field: 'field1', operator: '=', value: 'value1' })
          .setOrderBy('field1 ASC')
          .setLimit(10)
          .setOffset(5)
          .addJoin('INNER', 'table2', 'table1.id = table2.id')
          .addAggregate('COUNT', 'name', 'count')
          .setGroupBy('field1');

        const options = qo.Options;
        expect(options).toEqual(qo.Options);
      });
    });

    describe('setOptions', () => {
      it('should set all query options from an object', () => {
        const options = {
          table: 'table_name',
          fields: 'field1, field2',
          conditions: [{ field: 'field1', operator: '=', value: 'value1' }],
          orderBy: 'field1 ASC',
          limit: 10,
          offset: 5,
          joins: [
            {
              type: 'INNER JOIN',
              table: 'table2',
              condition: 'table1.id = table2.id',
            },
          ],
          aggregates: [{ func: 'COUNT', field: 'name', alias: 'count' }],
          groupBy: 'field1',
        };

        qo.Options = options;

        expect(qo.table).toBe('table_name');
        expect(qo.fields).toBe('field1, field2');
        expect(qo.conditions).toContainEqual({
          field: 'field1',
          operator: '=',
          value: 'value1',
        });
        expect(qo.orderBy).toBe('field1 ASC');
        expect(qo.limit).toBe(10);
        expect(qo.offset).toBe(5);
        expect(qo.joins).toContainEqual({
          type: 'INNER JOIN',
          table: 'table2',
          condition: 'table1.id = table2.id',
        });
        expect(qo.aggregates).toContainEqual({
          func: 'COUNT',
          field: 'name',
          alias: 'count',
        });
        expect(qo.groupBy).toBe('field1');
      });
    });

    it('should throw an error if options is not an object', () => {
      expect(() => {
        qo.Options = 'invalid options';
      }).toThrow('Invalid options object.');
    });
  });

  describe('setTable', () => {
    it('should set the table name', () => {
      qo.setTable('table_name');
      expect(qo.table).toBe('table_name');
    });
  });

  describe('setFields', () => {
    it('it should set the fields to select', () => {
      qo.setFields('field1, field2');
      expect(qo.fields).toBe('field1, field2');
    });
  });

  describe('addCondition', () => {
    it('should add a condition to the conditions array', () => {
      const condition = { field: 'field1', operator: '=', value: 'value1' };
      qo.addCondition(condition);
      expect(qo.conditions).toContainEqual(condition);
    });
  });

  describe('setOrderBy', () => {
    it('should set the order by clause', () => {
      qo.setOrderBy('field1 ASC');
      expect(qo.orderBy).toBe('field1 ASC');
    });
  });

  describe('setLimit', () => {
    it('should set the limit for the query', () => {
      qo.setLimit(10);
      expect(qo.limit).toBe(10);
    });
  });

  describe('setOffset', () => {
    it('should set the offset for the query', () => {
      qo.setOffset(5);
      expect(qo.offset).toBe(5);
    });
  });

  describe('addJoin', () => {
    it('should add a join to the joins array', () => {
      const join = {
        type: 'INNER JOIN',
        table: 'table2',
        condition: 'table1.id = table2.id',
      };
      qo.addJoin(join.type, join.table, join.condition);
      expect(qo.joins).toContainEqual(join);
    });
  });

  describe('addAggregate', () => {
    it('should add an aggregate to the aggregates array', () => {
      const aggregate = { func: 'COUNT', field: 'name', alias: 'count' };
      qo.addAggregate(aggregate.func, aggregate.field, aggregate.alias);
      expect(qo.aggregates).toContainEqual(aggregate);
    });
  });

  describe('setGroupBy', () => {
    it('should set the GROUP BY clause', () => {
      qo.setGroupBy('field1');
      expect(qo.groupBy).toBe('field1');
    });
  });
});
