'./__tests__/QueryOptions.spec.js';

const { query } = require('express');
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
const { DBError } = require('../db/errors');

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
        includeTimestamps: false,
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
        includeTimestamps: false,
      });
    });

    describe('get Options', () => {
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
        qo.values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        const options = qo.Options;
        expect(options).toEqual(qo.Options);
      });
    });

    describe('set Options', () => {
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
              type: 'INNER',
              table: 'table2',
              condition: 'table1.id = table2.id',
            },
          ],
          aggregates: [{ func: 'COUNT', field: 'name', alias: 'count' }],
          groupBy: 'field1',
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
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
          type: 'INNER',
          table: 'table2',
          condition: 'table1.id = table2.id',
        });
        expect(qo.aggregates).toContainEqual({
          func: 'COUNT',
          field: 'name',
          alias: 'count',
        });
        expect(qo.groupBy).toBe('field1');
        expect(qo.values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should throw an error for invalid options object', () => {
        expect(() => {
          qo.Options = null;
        }).toThrow(DBError);

        expect(() => {
          qo.Options = 'invalid';
        }).toThrow(DBError);

        expect(() => {
          qo.Options = [];
        }).toThrow(DBError);

        expect(() => {
          qo.Options = {};
        }).toThrow(DBError);
      });

      it('should throw an error if table name is not a string', () => {
        expect(() => {
          qo.Options = { table: 123 };
        }).toThrow(DBError);
      });

      it('should throw an error if fields is not a string', () => {
        expect(() => {
          qo.Options = { fields: 123 };
        }).toThrow(DBError);
      });

      it('should throw an error if conditions is not an array', () => {
        expect(() => {
          qo.Options = { conditions: 'invalid condition' };
        }).toThrow(DBError);
      });

      it('should throw an error if orderBy is not a string', () => {
        expect(() => {
          qo.Options = { orderBy: 123 };
        }).toThrow(DBError);
      });

      it('should throw an error if limit is not a number', () => {
        expect(() => {
          qo.Options = { limit: 'invalid limit' };
        }).toThrow(DBError);
      });

      // it('should throw an error if offset is not a number', () => {
      //   expect(() => {
      //     qo.Options = { offset: 'invalid offset' };
      //   }).toThrow(DBError);
      // } );

      it('should throw an error if joins is not an array', () => {
        expect(() => {
          qo.Options = { joins: 'invalid join' };
        }).toThrow(DBError);
      });

      it('should throw an error if aggregates is not an array', () => {
        expect(() => {
          qo.Options = { aggregates: 'invalid aggregate' };
        }).toThrow(DBError);
      });

      it('should throw an error if groupBy is not a string', () => {
        expect(() => {
          qo.Options = { groupBy: 123 };
        }).toThrow(DBError);
      });

      it('should throw an error if value is null', () => {
        jest.spyOn(qo, 'addValue');
        qo.Options = { value: null };
        expect(qo.addValue).not.toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });

    it('should set includeTimestamps to true', () => {
      qo.Options = { includeTimestamps: true };
      expect(qo.includeTimestamps).toBe(true);
    });
  });

  describe('get Options', () => {
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
          type: 'INNER',
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
        includeTimestamps: false,
      });
    });
  });

  describe('setTable', () => {
    it('should set the table name', () => {
      qo.setTable('table_name');
      expect(qo.table).toBe('table_name');
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setTable('table_name');
      expect(result).toBe(qo);
    });

    it('should throw an error if the table name is not a string', () => {
      expect(() => {
        qo.setTable(123);
      }).toThrow('Invalid table name.');
    });

    it('should throw an error if the table name is an empty string', () => {
      expect(() => {
        qo.setTable('');
      }).toThrow('Invalid table name.');
    });

    it('should throw an error if the table name is null', () => {
      expect(() => {
        qo.setTable(null);
      }).toThrow('Invalid table name.');
    });

    it('should throw an error if the table name is undefined', () => {
      expect(() => {
        qo.setTable(undefined);
      }).toThrow('Invalid table name.');
    });
  });

  describe('setFields', () => {
    it('it should set the fields to select', () => {
      qo.setFields('field1, field2');
      expect(qo.fields).toBe('field1, field2');
    });

    it('should set the fields to select from an array', () => {
      qo.setFields(['field1', 'field2']);
      expect(qo.fields).toBe('field1, field2');
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setFields('field1, field2');
      expect(result).toBe(qo);
    });

    it('should throw an error if the fields are not a string or array', () => {
      expect(() => {
        qo.setFields(123);
      }).toThrow('Invalid field(s).');
    });

    it('should throw an error if the fields are an empty string', () => {
      expect(() => {
        qo.setFields('');
      }).toThrow('Invalid field(s).');
    });
  });

  describe('addCondition', () => {
    it('should add a condition to the conditions array', () => {
      const condition = { field: 'field1', operator: '=', value: 'value1' };
      qo.addCondition(condition);
      expect(qo.conditions).toContainEqual(condition);
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.addCondition({
        field: 'field1',
        operator: '=',
        value: 'value1',
      });
      expect(result).toBe(qo);
    });

    it('should throw an error if the condition is not an object', () => {
      expect(() => {
        qo.addCondition('invalid condition');
      }).toThrow('Invalid condition(s).');
    });

    it('should throw an error if the condition is null', () => {
      expect(() => {
        qo.addCondition(null);
      }).toThrow('Invalid condition(s).');
    });
  });

  describe('setOrderBy', () => {
    it('should set the order by clause', () => {
      qo.setOrderBy('field1 ASC');
      expect(qo.orderBy).toBe('field1 ASC');
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setOrderBy('field1 ASC');
      expect(result).toBe(qo);
    });

    it('should throw an error if the order by clause is not a string', () => {
      expect(() => {
        qo.setOrderBy(123);
      }).toThrow('Invalid ORDER BY clause.');
    });

    it('should throw an error if the order by clause is null', () => {
      expect(() => {
        qo.setOrderBy(null);
      }).toThrow('Invalid ORDER BY clause.');
    });

    it('should throw an error if the order by clause is an empty string', () => {
      expect(() => {
        qo.setOrderBy('');
      }).toThrow('Invalid ORDER BY clause.');
    });
  });

  describe('setLimit', () => {
    it('should set the limit for the query', () => {
      qo.setLimit(10);
      expect(qo.limit).toBe(10);
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setLimit(10);
      expect(result).toBe(qo);
    });

    it('should throw an error if the limit is not a number', () => {
      expect(() => {
        qo.setLimit('invalid limit');
      }).toThrow('Invalid limit value.');
    });

    it('should set the limit to 10 if the limit is less than 10', () => {
      qo.setLimit(5);
      expect(qo.limit).toBe(10);
    });
  });

  describe('setOffset', () => {
    it('should set the offset for the query', () => {
      qo.setOffset(5);
      expect(qo.offset).toBe(5);
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setOffset(5);
      expect(result).toBe(qo);
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

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.addJoin(
        'INNER JOIN',
        'table2',
        'table1.id = table2.id'
      );
      expect(result).toBe(qo);
    });

    it('should throw an error if the join type is not a string', () => {
      expect(() => {
        qo.addJoin(123, 'table2', 'table1.id = table2.id');
      }).toThrow('Invalid join type.');
    });

    it('should throw an error if the table name is not a string', () => {
      expect(() => {
        qo.addJoin('INNER JOIN', 123, 'table1.id = table2.id');
      }).toThrow('Invalid join table.');
    });

    it('should throw an error if the join condition is not a string', () => {
      expect(() => {
        qo.addJoin('INNER JOIN', 'table2', 123);
      }).toThrow('Invalid join condition.');
    });

    it('should throw an error if the join type is null', () => {
      expect(() => {
        qo.addJoin(null, 'table2', 'table1.id = table2.id');
      }).toThrow('Invalid join type.');
    });

    it('should throw an error if the table name is null', () => {
      expect(() => {
        qo.addJoin('INNER', null, 'table1.id = table2.id');
      }).toThrow('Invalid join table.');
    });

    it('should throw an error if the join condition is null', () => {
      expect(() => {
        qo.addJoin('INNER JOIN', 'table2', null);
      }).toThrow('Invalid join condition.');
    });

    it('should throw an error if the join type is an empty string', () => {
      expect(() => {
        qo.addJoin('', 'table2', 'table1.id = table2.id');
      }).toThrow('Invalid join type.');
    });
  });

  describe('addAggregate', () => {
    it('should add an aggregate to the aggregates array', () => {
      const aggregate = { func: 'COUNT', field: 'name', alias: 'count' };
      qo.addAggregate(aggregate.func, aggregate.field, aggregate.alias);
      expect(qo.aggregates).toContainEqual(aggregate);
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.addAggregate('COUNT', 'name', 'count');
      expect(result).toBe(qo);
    });

    it('should throw an error if the aggregate function is not a string', () => {
      expect(() => {
        qo.addAggregate(123, 'name', 'count');
      }).toThrow('Invalid function.');
    });

    it('should throw an error if the field is not a string', () => {
      expect(() => {
        qo.addAggregate('COUNT', 123, 'count');
      }).toThrow('Invalid field.');
    });

    it('should throw an error if the alias is not a string', () => {
      expect(() => {
        qo.addAggregate('COUNT', 'name', 123);
      }).toThrow('Invalid alias.');
    });

    it('should throw an error if the aggregate function is null', () => {
      expect(() => {
        qo.addAggregate(null, 'name', 'count');
      }).toThrow('Invalid function.');
    });

    it('should throw an error if the field is null', () => {
      expect(() => {
        qo.addAggregate('COUNT', null, 'count');
      }).toThrow('Invalid field.');
    });

    it('should throw an error if the alias is null', () => {
      expect(() => {
        qo.addAggregate('COUNT', 'name', null);
      }).toThrow('Invalid alias.');
    });

    it('should throw an error if the aggregate function is an empty string', () => {
      expect(() => {
        qo.addAggregate('', 'name', 'count');
      }).toThrow('Invalid function.');
    });

    it('should throw an error if the field is an empty string', () => {
      expect(() => {
        qo.addAggregate('COUNT', '', 'count');
      }).toThrow('Invalid field.');
    });

    it('should throw an error if the alias is an empty string', () => {
      expect(() => {
        qo.addAggregate('COUNT', 'name', '');
      }).toThrow('Invalid alias.');
    });

    it('should throw an error if the aggregate function is not a valid function', () => {
      expect(() => {
        qo.addAggregate('INVALID', 'name', 'count');
      }).toThrow('Invalid aggregate function name.');
    });
  });

  describe('setGroupBy', () => {
    it('should set the GROUP BY clause', () => {
      qo.setGroupBy('field1');
      expect(qo.groupBy).toBe('field1');
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.setGroupBy('field1');
      expect(result).toBe(qo);
    });

    it('should throw an error if the GROUP BY clause is not a string', () => {
      expect(() => {
        qo.setGroupBy(123);
      }).toThrow('Invalid GROUP BY clause.');
    });

    it('should throw an error if the GROUP BY clause is null', () => {
      expect(() => {
        qo.setGroupBy(null);
      }).toThrow('Invalid GROUP BY clause.');
    });

    it('should throw an error if the GROUP BY clause is an empty string', () => {
      expect(() => {
        qo.setGroupBy('');
      }).toThrow('Invalid GROUP BY clause.');
    });

    it('should throw an error if the GROUP BY clause is undefined', () => {
      expect(() => {
        qo.setGroupBy(undefined);
      }).toThrow('Invalid GROUP BY clause.');
    });
  });

  describe('addValue', () => {
    it('should add a value to the values array', () => {
      qo.addValue(10);
      expect(qo.values).toContainEqual(10);
    });

    it('should add a value array to the values array', () => {
      qo.addValue([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      expect(qo.values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should return the QueryOptions instance for method chaining', () => {
      const result = qo.addValue(10);
      expect(result).toBe(qo);
    });

    it('should throw an error if the value is null', () => {
      expect(() => {
        qo.addValue(null);
      }).toThrow('Invalid value.');
    });
  });
});
