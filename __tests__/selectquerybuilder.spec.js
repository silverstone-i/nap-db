const SelectQueryBuilder = require('../db/SelectQueryBuilder');
const { DBError } = require('../db/errors');

describe('SelectQueryBuilder', () => {
  let qb;

  beforeAll(() => {
    qb = new SelectQueryBuilder();
  });

  afterEach(() => {
    qb.reset();
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
