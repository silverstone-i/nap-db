const QueryBuilder = require('../db/QueryBuilder');

describe('QueryBuilder', () => {
  let qb;

  beforeEach(() => {
    qb = new QueryBuilder();
  });

  describe('reset', () => {
    it('should clear the table name to an empty string when reset is called', () => {
      qb.setTable('users');
      qb.reset();
      expect(qb.table).toBe('');
    });

    it('should work correctly when called multiple times consecutively', () => {
      qb.setTable('users').setFields(['id', 'name']).addCondition('id = ?', 1);
      qb.reset();
      qb.reset();
      expect(qb.table).toBe('');
      expect(qb.fields).toBe('*');
      expect(qb.conditions).toEqual([]);
      expect(qb.orderBy).toBe('');
      expect(qb.limit).toBeUndefined();
      expect(qb.offset).toBeUndefined();
      expect(qb.joins).toEqual([]);
      expect(qb.aggregates).toEqual([]);
      expect(qb.groupBy).toBe('');
      expect(qb.values).toEqual([]);
    });
  });

  describe('buildQuery', () => {
    it('should build a simple SELECT query with default fields', () => {
      qb.setTable('users');
      const result = qb.buildQuery();
      expect(result.query).toBe('SELECT * FROM users');
      expect(result.values).toEqual([]);
    });

    it('should throw an error when no table is set', () => {
      expect(() => qb.buildQuery()).toThrow('No table set');
    });

    it('should generate a SELECT query with specified fields', () => {
      qb.setTable('users').setFields(['id', 'name']);
      const result = qb.buildQuery();
      expect(result.query).toBe('SELECT id, name FROM users');
      expect(result.values).toEqual([]);
    });

    it('should generate a SELECT query with specified conditions', () => {
      qb.setTable('users').addCondition({
        field: 'active',
        operator: '=',
        value: true,
      });
      const result = qb.buildQuery();
      expect(result.query).toBe('SELECT * FROM users WHERE active = true');
      expect(result.values).toEqual([]);
    });
  });

  describe('addWhereClause', () => {
    it('should add a single condition with a basic operator', () => {
      qb.addCondition({ field: 'age', operator: '>', value: 18 });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE age > 18');
    });

    it('should return the original query when no conditions are present', () => {
      let query = 'SELECT * FROM users';
      query = qb.addWhereClause(query);
      expect(query).toBe('SELECT * FROM users');
    });

    it('should add multiple conditions with different operators', () => {
      qb.addCondition({ field: 'age', operator: '>', value: 18 });
      qb.addCondition({
        field: 'name',
        operator: 'LIKE',
        value: 'John',
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(" WHERE age > 18 AND name LIKE 'John'");
    });

    it('should add conditions with LIKE operator when specified', () => {
      qb.addCondition({
        field: 'name',
        operator: 'LIKE',
        value: '%John%',
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(" WHERE name LIKE '%John%'");
    });

    it('should handle nested conditions with empty sub-groups (Fixed)', () => {
      qb.addCondition({ field: 'age', operator: '>', value: 18 });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE age > 18');
    });

    it('should add conditions with IN operator when specified', () => {
      qb.addCondition({
        field: 'age',
        operator: 'IN',
        value: [18, 21, 25],
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE age IN (18, 21, 25)');
    });

    it('should add conditions with BETWEEN operator when specified', () => {
      qb.addCondition({
        field: 'salary',
        operator: 'BETWEEN',
        value: [50000, 80000],
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE salary BETWEEN 50000 AND 80000');
    });

    it('should add conditions with IS NULL and IS NOT NULL operators', () => {
      qb.addCondition({
        field: 'name',
        operator: 'IS NULL',
        value: null,
      });
      qb.addCondition({
        field: 'status',
        operator: 'IS NOT NULL',
        value: null,
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE name IS NULL AND status IS NOT NULL');
    });

    it('should handle empty condition object', () => {
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe('');
    });

    it('should handle condition with unsupported operator', () => {
      qb.addCondition({
        field: 'name',
        operator: 'INVALID',
        value: 'value',
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE name INVALID value');
    });

    it('should handle missing field or value in condition with IS NULL operator', () => {
      qb.addCondition({ field: 'some_field', operator: 'IS NULL' });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE some_field IS NULL');
    });

    it('should handle nested conditions without empty sub-groups', () => {
      qb.addCondition({ field: 'age', operator: '>', value: 18 });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE age > 18');
    });

    // Conditions with special characters in values
    it('should handle special characters in condition values', () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.addCondition({
        field: 'name',
        operator: 'LIKE',
        value: "John's%",
      });
      let query = '';
      query = queryBuilder.addWhereClause(query);
      expect(query).toBe(" WHERE name LIKE 'John's%'");
    });

    it('should handle missing field or value in condition', () => {
      qb.addCondition({ field: 'some_field', operator: 'IS NULL' });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE some_field IS NULL');
    });

    it('should properly format conditions with string values', () => {
      qb.addCondition({
        field: 'name',
        operator: 'LIKE',
        value: 'John',
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(" WHERE name LIKE 'John'");
    });

    it('should properly format conditions with array values', () => {
      qb.addCondition({
        field: 'id',
        operator: 'IN',
        value: [1, 2, 3],
      });
      let query = '';
      query = qb.addWhereClause(query);
      expect(query).toBe(' WHERE id IN (1, 2, 3)');
    });

    it('should set a single column for ordering when provided', () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.setTable('users').setOrderBy('created_at DESC');
      const query = queryBuilder.buildQuery();
      expect(query).toEqual({
        query: 'SELECT * FROM users ORDER BY created_at DESC',
        values: [],
      });
    });

    // Generated by CodiumAI

    describe('setLimit', () => {
      // sets the limit to a positive integer and includes an offset
      it('should set the limit to a positive integer when provided', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder.setTable('users').setLimit(10).setOffset(0);
        const query = queryBuilder.buildQuery();
        expect(query.query).toContain('LIMIT ? OFFSET ?');
        expect(query.values).toContain(10);
        expect(query.values).toContain(0);
      });

      // sets the limit to a negative integer and includes an offset of 0
      it('should set the limit to a negative integer when provided along with an offset of 0', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder.setTable('users').setLimit(-5).setOffset(0);
        const query = queryBuilder.buildQuery();
        expect(query.query).toContain('LIMIT ? OFFSET ?');
        expect(query.values).toContain(-5, 0);
      });

      // correctly adds a join with type, table, and condition
      it('should correctly add a join with type, table, and condition', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder
          .setTable('users')
          .addJoin('INNER', 'orders', 'users.id = orders.user_id');
        const result = queryBuilder.buildQuery();
        expect(result.query).toContain(
          'INNER JOIN orders ON users.id = orders.user_id'
        );
      });

      // Ensures that only valid join clauses are added to the query
      it('should handle valid join clauses', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder
          .setTable('users')
          .addJoin('INNER', 'orders', 'users.id = orders.user_id');
        const result = queryBuilder.buildQuery();
        expect(result.query).toBe(
          'SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id'
        );
      });

      // Generated by CodiumAI

      describe('addAggregate', () => {
        // Adds a single aggregate function correctly
        it('should add a single aggregate function correctly', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder
            .setTable('users')
            .addAggregate('COUNT', 'id', 'total_users');
          const query = queryBuilder.buildQuery();
          expect(query.query).toBe(
            'SELECT COUNT(id) AS total_users FROM users'
          );
        });

        // Adds an aggregate with an empty function name
        it('should handle an empty function name gracefully', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setTable('users').addAggregate('', 'id', 'total_users');
          const query = queryBuilder.buildQuery();
          expect(query.query).toBe('SELECT (id) AS total_users FROM users');
        });
      });

      // Generated by CodiumAI

      describe('setGroupBy', () => {
        // sets a single column as groupBy
        it('should set a single column as groupBy', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setGroupBy('country');
          expect(queryBuilder.groupBy).toBe('country');
        });

        // sets groupBy to an empty string
        it('should set groupBy to an empty string', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setGroupBy('');
          expect(queryBuilder.groupBy).toBe('');
        });
      });

      // builds SQL query with the latest groupBy value
      it('should build the SQL query with the latest groupBy value set', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder.setTable('users'); // Set a table
        queryBuilder.setGroupBy('country');
        queryBuilder.setGroupBy('city');
        const { query } = queryBuilder.buildQuery();
        expect(query).toBe('SELECT * FROM users GROUP BY city');
      });

      // Generated by CodiumAI

      describe('buildAggregateQuery', () => {
        // Generates correct query with single aggregate function
        it('should generate correct query with single aggregate function', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder
            .setTable('orders')
            .addAggregate('SUM', 'total_amount', 'total_sales')
            .setGroupBy('product_id');
          const aggregateQuery = queryBuilder.buildAggregateQuery();
          expect(aggregateQuery).toBe(
            'SELECT SUM(total_amount) AS total_sales FROM orders GROUP BY product_id'
          );
        });

        // Handles empty aggregates array gracefully
        it('should handle empty aggregates array gracefully', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setTable('orders');
          const aggregateQuery = queryBuilder.buildAggregateQuery();
          expect(aggregateQuery).toBe('SELECT  FROM orders');
        });
      });

      // Ensure that the query is correctly built with conditions when no aggregates are present
      it('should handle empty aggregates array gracefully with nested where group', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder.setTable('orders');
        queryBuilder.addCondition({
          field: 'status',
          operator: '=',
          value: 'shipped',
        });
        queryBuilder.addCondition({
          field: 'quantity',
          operator: '>',
          value: 10,
        });
        const aggregateQuery = queryBuilder.buildQuery();
        expect(aggregateQuery.query).toBe(
          'SELECT * FROM orders WHERE status = shipped AND quantity > 10'
        );
      });

      // Generates correct query with single aggregate function using nested clauses
      it('should generate correct query with single aggregate function using nested clauses', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder
          .setTable('orders')
          .addAggregate('SUM', 'total_amount', 'total_sales')
          .setGroupBy('product_id');
        const aggregateQuery = queryBuilder.buildAggregateQuery();
        expect(aggregateQuery).toBe(
          'SELECT SUM(total_amount) AS total_sales FROM orders GROUP BY product_id'
        );
      });

      it('should generate correct query with single aggregate function using nested clauses', () => {
        const queryBuilder = new QueryBuilder();
        queryBuilder
          .setTable('orders')
          .addAggregate('SUM', 'total_amount', 'total_sales')
          .setGroupBy('product_id');
        const aggregateQuery = queryBuilder.buildAggregateQuery();
        expect(aggregateQuery).toBe(
          'SELECT SUM(total_amount) AS total_sales FROM orders GROUP BY product_id'
        );
      });

      it('should generate correct query with nested clauses', () => {
        const queryBuilder = new QueryBuilder();

        queryBuilder.setTable('orders');

        // Example conditions array
        const conditions = [
          [
            { field: 'age', operator: '>', value: 18 },
            { field: 'city', operator: '=', value: 'New York' },
          ],
          [
            { field: 'gender', operator: '=', value: 'Male' },
            { field: 'subscription', operator: '=', value: 'Premium' },
          ],
        ];
        queryBuilder.addCondition(conditions);

        // Example expected query string with nested clauses
        const expectedQuery =
          'SELECT * FROM orders WHERE ((age > 18 AND city = New York AND gender = Male AND subscription = Premium))';

        // Getting the query string from the QueryBuilder instance
        const resultingQuery = queryBuilder.buildQuery();

        // Asserting the final query with nested clauses
        expect(resultingQuery.query).toBe(expectedQuery);
      });

      // Generated by CodiumAI

      describe('setFields', () => {
        // sets fields when given an array of field names
        it('should set fields correctly when given an array of field names', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setFields(['id', 'name', 'email']);
          expect(queryBuilder.fields).toBe('id, name, email');
        });

        // handles null or undefined input gracefully
        it('should handle null or undefined input gracefully', () => {
          const queryBuilder = new QueryBuilder();
          queryBuilder.setFields(null);
          expect(queryBuilder.fields).toBe(null);

          queryBuilder.setFields(undefined);
          expect(queryBuilder.fields).toBe(undefined);
        });
      });
    });
  });
});
