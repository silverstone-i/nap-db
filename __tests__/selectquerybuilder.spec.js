const SelectQueryBuilder = require('../db/SelectQueryBuilder');

describe('SelectQueryBuilder', () => {
  let qb;

  beforeAll(() => {
    qb = new SelectQueryBuilder();
  });

  afterEach(() => {
    qb.reset();
  });

  // describe('Constructor', () => {
  //   it('should create a new instance of SelectQueryBuilder and call reset', () => {
  //     // Mock the reset method
  //     const resetMock = jest.fn();

  //     // Save a reference to the original reset method
  //     const originalReset = SelectQueryBuilder.prototype.reset;

  //     // Replace the prototype's reset method with the mock
  //     SelectQueryBuilder.prototype.reset = resetMock;

  //     // Create a new instance of SelectQueryBuilder
  //     const sqb = new SelectQueryBuilder();

  //     // Expect reset method to have been called once
  //     expect(resetMock).toHaveBeenCalledTimes(1);

  //     delete SelectQueryBuilder.prototype.reset

  //     // Clean up: Restore the original reset method
  //     SelectQueryBuilder.prototype.reset = originalReset;
  //   });
  // });

  describe('Reset Method', () => {
    it('should clear the table name to an empty string when reset is called', () => {
      qb.setTable('users');
      qb.reset();
      expect(qb.table).toBe('');
    });

    it('should reset all properties to their default values', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 });
      qb.reset();
      expect(qb).toEqual({
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

  describe('setOptions Method', () => {
    it('should set the options for the query', () => {
      qb.setOptions({
        table: 'users',
        fields: ['id', 'name'],
      });
      expect(qb.table).toBe('users');
      expect(qb.fields).toEqual('id, name');
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setOptions({
        table: 'users',
        fields: ['id', 'name'],
      });
      expect(result).toBe(qb);
    }
    );
    
    it('should not set any properties if an empty options object is provided', () => {
      qb.setOptions({});
      expect(qb).toEqual({
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

    it('should throw an error if no options object is provided', () => {
      expect(() => qb.setOptions()).toThrow('Invalid options object.');
    });

    it('should throw an error if the options object is not an object', () => {
      expect(() => qb.setOptions('users')).toThrow('Invalid options object.');
    });

    it('should not set any properties if the options are invalid', () => {
      qb.setOptions({ cat: 'users' });
      expect(qb).toEqual({
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

    it('should not throw an error if the options are valid', () => {
      expect(() =>
        qb.setOptions({ table: 'users', fields: ['id', 'name'] })
      ).not.toThrow();
    });

    it('should copy the conditions object successfully', () => {
      const conditions = [
        { field: 'id', operator: '=', value: 1 },
        { field: 'name', operator: 'LIKE', value: 'John' },
      ];
      qb.setOptions({ table: 'users', conditions });
      expect(qb.conditions).toEqual(conditions);
    });

    it('should copy a nested conditions object successfully', () => {
      const conditions = [
        { field: 'id', operator: '=', value: 1 },
        {
          conjunction: 'OR',
          conditions: [
            { field: 'name', operator: 'LIKE', value: 'John' },
            { field: 'name', operator: 'LIKE', value: 'Doe' },
          ],
        },
      ];
      qb.setOptions({ table: 'users', conditions });
      expect(qb.conditions).toEqual(conditions);
    });

    it('should copy the joins object successfully', () => {
      const joins = [
        { type: 'INNER', table: 'posts', condition: 'users.id = posts.user_id' },
        { type: 'LEFT OUTER', table: 'comments', condition: 'users.id = comments.user_id' }
      ];
      qb.setOptions({ table: 'users', joins });
      expect(qb.joins).toEqual(joins);
    });

    it('should copy the aggregates object successfully', () => {
      const aggregates = [
        { func: 'COUNT', field: 'id', alias: 'total' },
        { func: 'AVG', field: 'age', alias: 'average' },
      ];
      qb.setOptions({ table: 'users', aggregates });
      expect(qb.aggregates).toEqual(aggregates);
    });

    it('should copy the orderBy, limit, offet and groupBy properties successfully', () => {
      const orderBy = 'name ASC';
      const limit = 10;
      const offset = 5;
      qb.setOptions({ table: 'users', orderBy, limit, offset, groupBy: 'name' });
      expect(qb.orderBy).toBe(orderBy);
      expect(qb.limit).toBe(limit);
      expect(qb.offset).toBe(offset);
      expect(qb.groupBy).toEqual('name');
    });
  });

  describe('setTable Method', () => {
    it('should set the table for the query', () => {
      qb.setTable('users');
      expect(qb.table).toBe('users');
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setTable('users');
      expect(result).toBe(qb);
    });

    it('should throw an error if no table is set', () => {
      expect(() => qb.buildQuery()).toThrow('No table set');
    });

    it('should throw an error if the table name is invalid', () => {
      expect(() => qb.setTable(null)).toThrow('Invalid table name.');
    });

    it('should throw an error if the table name is not a string', () => {
      expect(() => qb.setTable(123)).toThrow('Invalid table name.');
    });

    it('should not throw an error if the table name is valid', () => {
      expect(() => qb.setTable('users')).not.toThrow();
    });
  });

  describe('setFields Method', () => {
    it('should set the fields for the query', () => {
      qb.setFields(['id', 'name']);
      expect(qb.fields).toEqual('id, name');
    });

    it('should set the fields for the query when fields id a single value', () => {
      qb.setFields('id');
      expect(qb.fields).toEqual('id');
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setFields(['id', 'name']);
      expect(result).toBe(qb);
    });

    it('should throw an error if the fields are invalid', () => {
      expect(() => qb.setFields(null)).toThrow('Invalid field(s).');
    });

    it('should not throw an error if the fields are valid', () => {
      expect(() => qb.setFields(['id'])).not.toThrow();
    });
  });

  describe('addCondition Method', () => {
    it('should add a condition to the query', () => {
      qb.addCondition({ field: 'id', operator: '=', value: '$1' });
      expect(qb.conditions).toEqual([
        { field: 'id', operator: '=', value: '$1' },
      ]);
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.addCondition({ field: 'id', operator: '=', value: 1 });
      //   console.log('result:', result);
      //   console.log('qb:', qb);
      //   console.log('result === qb: ', result === qb);

      expect(result).toBe(qb);
    });

    it('should throw an error if the condition is invalid', () => {
      expect(() => qb.addCondition(null)).toThrow('Invalid condition(s).');
    });

    it('should throw an error if the condition is not an object', () => {
      expect(() => qb.addCondition('id = 1')).toThrow('Invalid condition(s).');
    });

    it('should not throw an error if the condition is valid', () => {
      expect(() =>
        qb.addCondition({ field: 'id', operator: '=', value: 1 })
      ).not.toThrow();
    });
  });

  describe('setOrderBy Method', () => {
    it('should set the ORDER BY clause for the query', () => {
      qb.setOrderBy('name ASC');
      expect(qb.orderBy).toBe('name ASC');
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setOrderBy('name ASC');
      expect(result).toBe(qb);
    });

    it('should not throw an error if the ORDER BY clause is valid', () => {
      expect(() => qb.setOrderBy('name ASC')).not.toThrow();
    });
  });

  describe('setLimit Method', () => {
    it('should set the LIMIT clause for the query', () => {
      qb.setLimit(10);
      expect(qb.limit).toBe(10);
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setLimit(10);
      expect(result).toBe(qb);
    });

    it('should set the limit to 10 if the value is less than 10', () => {
      qb.setLimit(5);
      expect(qb.limit).toBe(10);
    });

    it('should not throw an error if the limit is valid', () => {
      expect(() => qb.setLimit(10)).not.toThrow();
    });

    it('should throw an error if the limit is not a number', () => {
      expect(() => qb.setLimit('10')).toThrow('Invalid limit value.');
    });
  });

  describe('setOffset Method', () => {
    // Add your tests for setOffset method here
  });

  describe('addJoin Method', () => {
    it('should add a join to the query', () => {
      qb.addJoin('INNER JOIN', 'posts', 'users.id = posts.user_id');
      expect(qb.joins).toEqual([
        {
          type: 'INNER JOIN',
          table: 'posts',
          condition: 'users.id = posts.user_id',
        },
      ]);
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.addJoin(
        'INNER JOIN',
        'posts',
        'users.id = posts.user_id'
      );
      expect(result).toBe(qb);
    });

    it('should not throw an error if the join is valid', () => {
      expect(() =>
        qb.addJoin('INNER JOIN', 'posts', 'users.id = posts.user_id')
      ).not.toThrow();
    });
  });

  describe('addAggregate Method', () => {
    it('should add an aggregate to the query', () => {
      qb.addAggregate('COUNT', 'id', 'total');
      expect(qb.aggregates).toEqual([
        { func: 'COUNT', field: 'id', alias: 'total' },
      ]);
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.addAggregate('COUNT', 'id', 'total');
      expect(result).toBe(qb);
    });

    it('should not throw an error if the aggregate is valid', () => {
      expect(() => qb.addAggregate('COUNT', 'id', 'total')).not.toThrow();
    });

    it('should throw an error if the aggregate function is invalid', () => {
      expect(() => qb.addAggregate('INVALID', 'id', 'total')).toThrow(
        'Invalid aggregate function name.'
      );
    });

    it('should throw an error if the function is missing', () => {
      expect(() => qb.addAggregate(null, 'id', 'total')).toThrow(
        'Invalid function.'
      );
    });

    it('should throw an error if the field is invalid', () => {
      expect(() => qb.addAggregate('COUNT', null)).toThrow('Invalid field.');
    });

    it('should throw an error if the alias is not valid', () => {
      expect(() => qb.addAggregate('COUNT', 'id')).toThrow('Invalid alias.');
    });

    it('should not throw an error if the field is valid', () => {
      expect(() => qb.addAggregate('COUNT', 'id', 'total')).not.toThrow();
    });

    it('should throw an error if the alias is invalid', () => {
      expect(() => qb.addAggregate('COUNT', 'id', null)).toThrow(
        'Invalid alias.'
      );
    });

    it('should not throw an error if the alias is valid', () => {
      expect(() => qb.addAggregate('COUNT', 'id', 'total')).not.toThrow();
    });
  });

  describe('setGroupBy Method', () => {
    it('should set the GROUP BY clause for the query', () => {
      qb.setGroupBy('name');
      expect(qb.groupBy).toBe('name');
    });

    it('should return the SelectQueryBuilder instance for method chaining', () => {
      const result = qb.setGroupBy('name');
      expect(result).toBe(qb);
    });

    it('should not throw an error if the GROUP BY clause is valid', () => {
      expect(() => qb.setGroupBy('name')).not.toThrow();
    });

    it('should throw an error if the GROUP BY clause is invalid', () => {
      expect(() => qb.setGroupBy(null)).toThrow('Invalid GROUP BY clause.');
    });

    it('should throw an error if the GROUP BY clause is not a string', () => {
      expect(() => qb.setGroupBy(123)).toThrow('Invalid GROUP BY clause.');
    });

    it('should not throw an error if the GROUP BY clause is valid', () => {
      expect(() => qb.setGroupBy('name')).not.toThrow();
    });
  });

  describe('buildQuery Method to build a SELECT SQL statement', () => {
    it('should return the query string when buildQuery is called', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' })
        .setOrderBy('name ASC');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2 ORDER BY name ASC'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should return the query string when buildQuery is called without conditions', () => {
      qb.setTable('users').setFields(['id', 'name']).setOrderBy('name ASC');

      const query = qb.buildQuery();

      expect(query.query).toBe('SELECT id, name FROM users ORDER BY name ASC');
      expect(query.values).toEqual([]);
    });

    it('should return the query string when buildQuery is called without ORDER BY clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should return the query string when buildQuery is called LIMIT clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' })
        .setLimit(25);

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2 LIMIT 25'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should return a SELECT query string when buildQuery is called with the LIMIT and OFFSET clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' })
        .setLimit(25)
        .setOffset(25);

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2 LIMIT 25 OFFSET 25'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should return the query string when buildQuery is called without LIMIT clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' })
        .setOrderBy('name ASC');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2 ORDER BY name ASC'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should return the query string when buildQuery is called without LIMIT and ORDER BY clauses', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .addCondition({ field: 'name', operator: 'LIKE', value: 'John' });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id = $1 AND name LIKE $2'
      );
      expect(query.values).toEqual([1, 'John']);
    });

    it('should throw an error if no table is set', () => {
      expect(() => qb.buildQuery()).toThrow('No table set');
    });

    it('should build a query using the IN clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'IN', value: [1, 2, 3] });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id IN ($1, $2, $3)'
      );
      expect(query.values).toEqual([1, 2, 3]);
    });

    it('should build a query using the NOT IN clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'NOT IN', value: [1, 2, 3] });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id NOT IN ($1, $2, $3)'
      );
      expect(query.values).toEqual([1, 2, 3]);
    });

    it('should build a query using the BETWEEN clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'BETWEEN', value: [1, 10] });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id BETWEEN $1 AND $2'
      );
      expect(query.values).toEqual([1, 10]);
    });

    it('should build a query using the NOT BETWEEN clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'NOT BETWEEN', value: [1, 10] });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id NOT BETWEEN $1 AND $2'
      );
      expect(query.values).toEqual([1, 10]);
    });

    it('should build a query using the IS NULL clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'IS NULL' });

      const query = qb.buildQuery();

      expect(query.query).toBe('SELECT id, name FROM users WHERE id IS NULL');
      expect(query.values).toEqual([]);
    });

    it('should build a query using the IS NOT NULL clause', () => {
      qb.setTable('users')
        .setFields(['id', 'name'])
        .addCondition({ field: 'id', operator: 'IS NOT NULL' });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT id, name FROM users WHERE id IS NOT NULL'
      );
      expect(query.values).toEqual([]);
    });

    it('should build a query using the addJoin method', () => {
      qb.setTable('users')
        .setFields(['users.id', 'users.name', 'posts.title'])
        .addJoin('INNER', 'posts', 'users.id = posts.user_id');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT users.id, users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id'
      );
      expect(query.values).toEqual([]);
    });

    it('should build a query using the addJoin method with multiple joins', () => {
      qb.setTable('users')
        .setFields(['users.id', 'users.name', 'posts.title', 'comments.body'])
        .addJoin('INNER', 'posts', 'users.id = posts.user_id')
        .addJoin('LEFT', 'comments', 'users.id = comments.user_id');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT users.id, users.name, posts.title, comments.body FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON users.id = comments.user_id'
      );
      expect(query.values).toEqual([]);
    });

    it('should build a query using the GROUP BY clause', () => {
      qb.setTable('users')
        .setFields(['name', 'COUNT(id) AS total'])
        .setGroupBy('name');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT name, COUNT(id) AS total FROM users GROUP BY name'
      );
      expect(query.values).toEqual([]);
    });

    it('should build a query containing a WHERE clause with nested conditions', () => {
      qb.setTable('users')
        .setFields(['age', 'gender', 'city'])
        .addCondition({ field: 'age', operator: '>', value: 18 })
        .addCondition({ field: 'gender', operator: '=', value: 'male' })
        .addCondition([
          { field: 'city', operator: '=', value: 'New York' },
          {
            conjunction: 'OR',
            field: 'city',
            operator: '=',
            value: 'Los Angeles',
          },
        ]);

      console.log('TEST CONDITIONS TYPE', Array.isArray(qb.conditions)); // Output: true
      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT age, gender, city FROM users WHERE age > $1 AND gender = $2 AND (city = $3 OR city = $4)'
      );
      expect(query.values).toEqual([18, 'male', 'New York', 'Los Angeles']);
    });
  });

  describe('buildQuery Method to build aggregation queries', () => {
    it('should return the query string when buildQuery is called with aggregation', () => {
      qb.setTable('users')
        .addAggregate('COUNT', 'id', 'total')
        .addAggregate('AVG', 'age', 'average')
        .setGroupBy('name');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT COUNT(id) AS total, AVG(age) AS average FROM users GROUP BY name'
      );
      expect(query.values).toEqual([]);
    });

    it('should return the query string when buildQuery is called with aggregation and conditions', () => {
      qb.setTable('users')
        .addAggregate('COUNT', 'id', 'total')
        .addAggregate('AVG', 'age', 'average')
        .setGroupBy('name')
        .addCondition({ field: 'id', operator: '=', value: 1 });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT COUNT(id) AS total, AVG(age) AS average FROM users WHERE id = $1 GROUP BY name'
      );
      expect(query.values).toEqual([1]);
    });

    it('should return the query string when buildQuery is called with aggregation and conditions and ORDER BY clause', () => {
      qb.setTable('users')
        .addAggregate('COUNT', 'id', 'total')
        .addAggregate('AVG', 'age', 'average')
        .setGroupBy('name')
        .addCondition({ field: 'id', operator: '=', value: 1 })
        .setOrderBy('name ASC');

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT COUNT(id) AS total, AVG(age) AS average FROM users WHERE id = $1 GROUP BY name ORDER BY name ASC'
      );
      expect(query.values).toEqual([1]);
    });

    it('should return the query string when buildQuery is called with aggregation and conditions clause', () => {
      qb.setTable('users')
        .addAggregate('COUNT', 'id', 'total')
        .addAggregate('AVG', 'age', 'average')
        .setGroupBy('name')
        .addCondition({ field: 'id', operator: '=', value: 1 });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT COUNT(id) AS total, AVG(age) AS average FROM users WHERE id = $1 GROUP BY name'
      );
      expect(query.values).toEqual([1]);
    });

    it('should return the query string when buildQuery is called with aggregation and conditions clause', () => {
      qb.setTable('users')
        .addAggregate('COUNT', 'id', 'total')
        .addAggregate('AVG', 'age', 'average')
        .setGroupBy('name')
        .addCondition({ field: 'id', operator: '=', value: 1 });

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT COUNT(id) AS total, AVG(age) AS average FROM users WHERE id = $1 GROUP BY name'
      );
      expect(query.values).toEqual([1]);
    });

    it('should build an aggregated query using SUM, GROUP BY, LIMIT, OFFSET and ORDER BY clauses', () => {
      qb.setTable('users')
        .addAggregate('SUM', 'amount', 'total')
        .setGroupBy('name')
        .setOrderBy('name ASC')
        .setLimit(10)
        .setOffset(10);

      const query = qb.buildQuery();

      expect(query.query).toBe(
        'SELECT SUM(amount) AS total FROM users GROUP BY name ORDER BY name ASC LIMIT 10 OFFSET 10'
      );
      expect(query.values).toEqual([]);
    });

    it('should build an aggregated query using COUNT and no GROUP BY clause', () => {
      qb.setTable('users').addAggregate('COUNT', 'id', 'total');

      const query = qb.buildQuery();

      expect(query.query).toBe('SELECT COUNT(id) AS total FROM users');
      expect(query.values).toEqual([]);
    });

    it('should build an aggregated query using STRING_AGG clause', () => {
      qb.setTable('users').addAggregate('STRING_AGG', 'name', 'names');

      const query = qb.buildQuery();

      expect(query.query).toBe('SELECT STRING_AGG(name) AS names FROM users');
      expect(query.values).toEqual([]);
    });
  });
});
