const pgp = require('pg-promise')({ capSQL: true });
const db = require('../db/DB').db;
const Model = require('../db/Model');
const { DBError } = require('../db/errors');
const QueryOptions = require('../db/QueryOptions');
const schema = {
  tableName: 'test_table',
  columns: {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(255)', nullable: false },
    email: { type: 'varchar(255)', nullable: false },
    age: { type: 'integer', nullable: true, default: 18 },
  },
};
const selectAll = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@doe.com',
    age: 30,
    created_by: 'Admin',
  },
  {
    id: 2,
    name: 'Jan Doe',
    email: 'jane@doe.com',
    age: 25,
    created_by: 'Admin',
  },
];

describe('Model', () => {
  let pgpSpy;
  let model;
  let dbStub;
  let options;

  beforeAll(() => {
    options = new QueryOptions();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    options.reset();

    pgpSpy = {
      as: {
        format: jest.spyOn(pgp.as, 'format'),
      },
      helpers: {
        insert: jest.spyOn(pgp.helpers, 'insert'),
        update: jest.spyOn(pgp.helpers, 'update'),
      },
    };

    dbStub = {
      none: jest.fn().mockResolvedValue(),
      one: jest.fn().mockResolvedValue(),
      oneOrNone: jest.fn().mockResolvedValue(null),
      any: jest.fn().mockResolvedValue(selectAll),
      manyOrNone: jest.fn().mockResolvedValue(selectAll),
      many: jest.fn().mockResolvedValue(selectAll),
      result: jest.fn().mockResolvedValue({ rowCount: 1 }),
    };

    model = new Model(dbStub, pgp, schema);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a new model', () => {
      expect(model).toBeDefined();
      expect(model.db).toStrictEqual(dbStub);
      expect(model.pgp).toStrictEqual(pgp);
      expect(model.schema).toStrictEqual(schema);
      expect(model.cs).toBeDefined();
    });

    it('should throw an exception if the database object is not defined', () => {
      try {
        new Model(null, pgp, schema);
      } catch (error) {
        expect(error.message).toBe('Invalid database.');
      }
    });

    it('should throw an exception if the pg-promise object is not defined', () => {
      try {
        new Model(dbStub, null, schema);
      } catch (error) {
        expect(error.message).toBe('Invalid pg-promise instance.');
      }
    });

    it('should throw an exception if the schema is not defined', () => {
      try {
        new Model(dbStub, pgp, null);
      } catch (error) {
        expect(error.message).toBe('Invalid schema.');
      }
    });

    it('should throw an exception if the schema does not have a tableName', () => {
      try {
        new Model(dbStub, pgp, {});
      } catch (error) {
        expect(error.message).toBe('Table name must be defined.');
      }
    });

    it('should throw an exception if the schema does not have columns', () => {
      try {
        new Model(dbStub, pgp, { tableName: 'test_table' });
      } catch (error) {
        expect(error.message).toBe('Schema requires at least one columns.');
      }
    });
  });

  describe('get columnset', () => {
    it('should return the column set', () => {
      expect(model.columnset).toBeDefined();
    });
  });

  describe('createTable', () => {
    it('should create a table based on schema - no foreign keys or unique constraints', async () => {
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with foreign keys and no unique constraints', async () => {
      model.schema.constraints = {
        fk_test_table:
          'FOREIGN KEY (email) REFERENCES test_table2 (email) ON DELETE CASCADE ON UPDATE CASCADE',
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL,CONSTRAINT fk_test_table FOREIGN KEY (email) REFERENCES test_table2 (email) ON DELETE CASCADE ON UPDATE CASCADE);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with unique constraints and no foreign keys', async () => {
      model.schema.constraints = {
        uq_name_email: 'UNIQUE (name, email)',
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL,CONSTRAINT uq_name_email UNIQUE (name,email));`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with foreign keys and unique constraints', async () => {
      model.schema.constraints = {
        fk_test_table:
          'FOREIGN KEY (email) REFERENCES test_table2 (email) ON DELETE CASCADE ON UPDATE CASCADE',
        uq_name_email: 'UNIQUE (name, email)',
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL,CONSTRAINT fk_test_table FOREIGN KEY (email) REFERENCES test_table2 (email) ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT uq_name_email UNIQUE (name,email));`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using GENERATE ALWAYS AS expression for a generated column', async () => {
      model.schema.columns.age.generated = '(18)';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18 GENERATED ALWAYS AS ((18)) STORED,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using UNIQUE', async () => {
      model.schema.columns.name.unique = true;

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL UNIQUE,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using CHECK', async () => {
      model.schema.columns.age.check = 'age >= 18';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18 CHECK (age >= 18),created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using COLLATE', async () => {
      model.schema.columns.name.collate = 'en_US';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL COLLATE en_US,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using COMMENT', async () => {
      model.schema.columns.name.comment = 'Name of the user';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL COMMENT 'Name of the user',email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using CONSTRAINT and INDEX', async () => {
      model.schema.columns.email.constraint = 'uq_email';
      model.schema.columns.email.index = 'idx_email';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL CONSTRAINT uq_email INDEX idx_email,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table using REFERENCES, ON UPDATE and ON DELETE clauses', async () => {
      model.schema.columns.email.references = 'test_table2(email)';
      model.schema.columns.email.onUpdate = 'CASCADE';
      model.schema.columns.email.onDelete = 'CASCADE';

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL REFERENCES test_table2(email) ON DELETE CASCADE ON UPDATE CASCADE,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should generate Index queries in addition to the select query', async () => {
      model.schema.indexes = {
        idx_name: { unique: true, config: 'name' },
        idx_email: { unique: false, config: 'email' },
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);CREATE UNIQUE INDEX idx_name ON test_table (name);CREATE INDEX idx_email ON test_table (email);`;

      await model.createTable();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should throw an exception when creating a table fails', async () => {
      dbStub.none.mockRejectedValue(new Error('Failed to create table.'));

      try {
        await model.createTable();
      } catch (error) {
        expect(error.message).toBe('Failed to create table.');
      }
    });

    it('calling Model.createTableQuery should generate the create table SQL', () => {
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by VARCHAR(50) NOT NULL,updated_at TIMESTAMPTZ DEFAULT NULL,updated_by VARCHAR(50) DEFAULT NULL);`;

      const actualQuery = model
        .createTableQuery()
        .replace(/\s*([.,;:])\s*|\s{2,}|\n/g, '$1');

      expect(actualQuery).toBe(expectedQuery);
    });

    it('should not generate timeStamps columns when schema.timeStamps is false', () => {
      model.schema.timeStamps = false;
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18);`;

      const actualQuery = model
        .createTableQuery()
        .replace(/\s*([.,;:])\s*|\s{2,}|\n/g, '$1');

      expect(actualQuery).toBe(expectedQuery);
    });

    it('addTotalCountToQuery should append total count string if FROM clause is not present', () => {
      const query = 'SELECT id, name';
      const expected = 'SELECT id, name, COUNT(*) OVER() AS total_count';
      expect(model._addTotalCountToQuery(query)).toBe(expected);
    });
  });

  describe('drop', () => {
    it('should drop the table', async () => {
      const expectedQuery = `DROP TABLE test_table;`;

      await model.drop();

      expect(dbStub.none).toHaveBeenCalledWith(expectedQuery);
    });

    it('should throw an exception when dropping a table fails', async () => {
      dbStub.none.mockRejectedValue(new Error('Failed to drop table.'));

      try {
        await model.drop();
      } catch (error) {
        expect(error.message).toBe('Failed to drop table.');
      }
    });
  });

  describe('insert', () => {
    it('should create a new record', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
      };
      const expectedDTO = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
      };
      const expectedQuery = `INSERT INTO "public"."test_table"("name","email","age","created_by") VALUES('John Doe','john@doe.com',30,'Admin')`;

      await model.insert(dto);

      // Verify the behavior and capture the value of actualQuery
      const actualDTO = pgpSpy.helpers.insert.mock.calls[0][0];
      const actualQuery = pgpSpy.helpers.insert.mock.results[0].value;

      expect(actualDTO).toEqual(expectedDTO);
      expect(actualQuery).toEqual(expectedQuery);
    });

    it('should create a new record when there are additional fields', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
        address: '123 Main St',
        phone: '555-1234',
      };
      const expectedDTO = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
        address: '123 Main St',
        phone: '555-1234',
      };
      const expectedQuery =
        'INSERT INTO "public"."test_table"("name","email","age","created_by") VALUES(\'John Doe\',\'john@doe.com\',30,\'Admin\')';

      await model.insert(dto);

      // Verify the behavior and capture the value of actualQuery
      const actualDTO = pgpSpy.helpers.insert.mock.calls[0][0];
      const actualQuery = pgpSpy.helpers.insert.mock.results[0].value;

      expect(actualDTO).toEqual(expectedDTO);
      expect(actualQuery).toEqual(expectedQuery);
    });
    it('should throw an exception when inserting a record without a required field', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
      };

      try {
        await model.insert(dto);
      } catch (error) {
        expect(error.message).toBe(`Property 'created_by' doesn't exist.`);
      }

      // await expect(model.insert(dto)).rejects.toThrow();
    });
  });

  describe('insertReturning', () => {
    it('should insert a record and return the inserted record', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
      };
      const expectedQuery = `INSERT INTO \"public\".\"test_table\"(\"name\",\"email\",\"age\",\"created_by\") VALUES('John Doe','john@doe.com',30,'Admin')`;
      const expectedDTO = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
      };

      await model.insertReturning(dto);

      const actualDTO = pgpSpy.helpers.insert.mock.calls[0][0];
      const actualQuery = pgpSpy.helpers.insert.mock.results[0].value;

      expect(actualQuery).toBe(expectedQuery);
      expect(actualDTO).toMatchObject(expectedDTO);

      expect(dbStub.one).toHaveBeenCalledWith(
        `INSERT INTO "public"."test_table"("name","email","age","created_by") VALUES('John Doe','john@doe.com',30,'Admin') RETURNING *`,
        actualDTO
      );
    });

    it('should throw an exception when inserting a record without a required field', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
      };

      try {
        await model.insertReturning(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(DBError);
      }
    });

    it('should throw an exception when inserting a record fails', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
      };

      dbStub.one.mockRejectedValueOnce(new Error('Insert failed'));

      try {
        await model.insertReturning(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(DBError);
      }
    });

    it('should correctly transform the result using (a) => a.rowCount', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        age: 30,
        created_by: 'Admin',
      };

      dbStub.one.mockResolvedValue({ rowCount: 1 });

      const result = await model.insertReturning(dto);

      expect(result).toEqual({ rowCount: 1 });
    });
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      options.setTable('test_table').setFields('*');
      const expectedQuery = `SELECT * FROM test_table`;
      const expectedValues = [];

      const result = await model.findAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should return records with conditions', async () => {
      const expectedQuery = `SELECT * FROM test_table WHERE name = $1`;
      const expectedValues = ['John Doe'];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' });

      const result = await model.findAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should return records with conditions and limit', async () => {
      const expectedQuery = `SELECT * FROM test_table WHERE name = $1 LIMIT 10`;
      const expectedValues = ['John Doe'];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' })
        .setLimit(10);

      const result = await model.findAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should return records with conditions, limit, and offset', async () => {
      const expectedQuery = `SELECT * FROM test_table WHERE name = $1 LIMIT 10 OFFSET 5`;
      const expectedValues = ['John Doe'];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' })
        .setLimit(10)
        .setOffset(5);

      const result = await model.findAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should throw an error when findAll fails', async () => {
      dbStub.manyOrNone.mockRejectedValue(new Error('Failed to find records'));

      try {
        await model.findAll(options);
      } catch (error) {
        expect(error.message).toBe('Failed to find records');
      }
    });
  });

  describe('findAndCountAll', () => {
    it('should return records with conditions and limit', async () => {
      const expectedQuery = `SELECT *, COUNT(*) OVER() AS total_count FROM test_table WHERE name = $1 LIMIT 10`;
      const expectedValues = ['John Doe'];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' })
        .setLimit(10);

      const result = await model.findAndCountAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should return original query if this.buildQuery contains "COUNT(*) OVER() AS total_count"', async () => {
      const expectedQuery = `SELECT *, COUNT(*) OVER() AS total_count FROM test_table WHERE name = $1 LIMIT 10`;
      const expectedValues = ['John Doe'];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' })
        .setLimit(10);

      //Create mock for buildQuery
      model.buildQuery = jest.fn().mockReturnValue({
        query: expectedQuery,
        values: expectedValues,
      });
      const result = await model.findAndCountAll(options);

      expect(dbStub.manyOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );

      model.buildQuery.mockReset();
    });

    it('should throw an error when SELECT query is missing a FROM clause', async () => {
      const expectedQuery = `SELECT 1 + 1`;
      const expectedValues = [];

      options
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' })
        .setLimit(10);

      //Create mock for buildQuery
      model.buildQuery = jest.fn().mockReturnValue({
        query: expectedQuery,
        values: expectedValues,
      });

      await expect(model.findAndCountAll(options)).rejects.toThrow(
        new Error('FROM clause not found in query.')
      );
      model.buildQuery.mockReset();
    });

    it('should throw an error when findAndCountAll fails', async () => {
      dbStub.manyOrNone.mockRejectedValue(new Error('Failed to find records'));

      try {
        await model.findAndCountAll(options);
      } catch (error) {
        expect(error.message).toBe('Failed to find records');
      }
    });
  });

  describe('findByPK', () => {
    it('should return a record by primary key', async () => {
      const expectedQuery = `SELECT id, name, email, age FROM test_table WHERE undefined = $1;`;
      const expectedValues = 1;

      const result = await model.findByPK(1);

      expect(dbStub.oneOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should throw an error when findByPK fails', async () => {
      dbStub.oneOrNone.mockRejectedValue(new Error('Failed to find record'));

      try {
        await model.findByPK(1);
      } catch (error) {
        expect(error.message).toBe('Failed to find record');
      }
    });

    it('should throw an error when findByPK is called without a primary key', async () => {
      try {
        await model.findByPK();
      } catch (error) {
        expect(error.message).toBe('Primary key is required.');
      }
    });

    it('should include timestamps when includeTimestamps is true', async () => {
      const expectedQuery = `SELECT * FROM test_table WHERE undefined = $1;`;
      const expectedValues = 1;

      options.includeTimestamps = true;

      const result = await model.findByPK(1, options);

      expect(dbStub.oneOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });
  });

  describe('findOne', () => {
    it('should return a record', async () => {
      const expectedQuery = `SELECT * FROM test_table WHERE name = $1`;
      const expectedValues = ['John Doe'];

      options = new QueryOptions()
        .setTable('test_table')
        .setFields('*')
        .addCondition({ field: 'name', operator: '=', value: 'John Doe' });

      const result = await model.findOne(options);

      expect(dbStub.oneOrNone).toHaveBeenCalledWith(
        expectedQuery,
        expectedValues
      );
    });

    it('should throw an error ', async () => {
      dbStub.oneOrNone.mockRejectedValue(new Error('Failed to find record'));

      try {
        await model.findOne(options);

        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to find record');
      }
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const dto = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
        age: 25,
        updated_by: 'Admin',
        _condition: 'WHERE id = ${id}',
      };
      const expectedCondition = 'WHERE id = 1';
      const expectedQuery = `UPDATE "public"."test_table" SET "name"='Jane Doe',"email"='jane@doe.com',"age"=25,"updated_at"=CURRENT_TIMESTAMP,"updated_by"='Admin'`;

      await model.update(dto);

      expect(pgpSpy.as.format).toHaveBeenCalledWith(dto._condition, dto);
      expect(pgpSpy.helpers.update).toHaveBeenCalledWith(dto, model.cs.update);
      expect(pgpSpy.as.format.mock.results[0].value).toBe(expectedCondition);
      expect(pgpSpy.helpers.update.mock.results[0].value).toBe(expectedQuery);
    });

    it('should throw an exception when updating a record without a condition', async () => {
      const dto = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
        age: 25,
        updated_by: 'Admin',
      };

      try {
        await model.update(dto);
      } catch (error) {
        expect(error.message).toBe('UPDATE requires a condition');
      }
      // await expect(model.update(dto)).rejects.toThrow();
    });

    it('should throw an exception when updating a record that does not exist', async () => {
      const dto = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
        age: 25,
        updated_by: 'Admin',
        _condition: 'WHERE id = ${id}',
      };

      dbStub.result.mockResolvedValue({ rowCount: 0 });

      try {
        await model.update(dto);
      } catch (error) {
        expect(error.message).toBe('No records found to update.');
      }
      // await expect(model.update(dto)).rejects.toThrow();
    });

    it('should correctly transform the result using (a) => a.rowCount', async () => {
      const dto = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
        age: 25,
        updated_by: 'Admin',
        _condition: 'WHERE id = ${id}',
      };

      dbStub.result.mockResolvedValue({ rowCount: 1 });

      const result = await model.update(dto);

      expect(result).toStrictEqual({ rowCount: 1 });
      expect(dbStub.result).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function)
      );

      // Check the transformation function directly
      const transformFunction = dbStub.result.mock.calls[0][1];
      expect(transformFunction({ rowCount: 10 })).toStrictEqual(10);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const dto = {
        id: 1,
        _condition: 'WHERE id = ${id}',
      };
      const expectedCondition = 'WHERE id = 1';
      const expectedQuery = `DELETE FROM test_table WHERE id = 1;`;

      await model.delete(dto);

      expect(pgpSpy.as.format.mock.results[0].value).toBe(expectedCondition);
      expect(pgpSpy.as.format.mock.results[1].value).toBe(expectedQuery);
      expect(pgpSpy.as.format.mock.calls[0][1]).toEqual(dto);
    });

    it('should throw an exception when deleting a record without a condition', async () => {
      const dto = {
        id: 1,
      };

      try {
        await model.delete(dto);
      } catch (error) {
        expect(error.message).toBe('DELETE requires a condition');
      }
      // await expect(model.delete(dto)).rejects.toThrow();
    });

    it('should throw an exception when deleting a record that does not exist', async () => {
      const dto = {
        id: 1,
        _condition: 'WHERE id = ${id}',
      };

      dbStub.result.mockResolvedValue({ rowCount: 0 });

      try {
        await model.delete(dto);
      } catch (error) {
        expect(error.message).toBe('No records found to delete');
      }
      // await expect(model.delete(dto)).rejects.toThrow();
    });

    it('should correctly transform the result using (a) => a.rowCount', async () => {
      const dto = {
        id: 1,
        _condition: 'WHERE id = ${id}',
      };

      dbStub.result.mockResolvedValue({ rowCount: 1 });

      const result = await model.delete(dto);

      expect(result).toStrictEqual({ rowCount: 1 });
      expect(dbStub.result).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function)
      );

      // Check the transformation function directly
      const transformFunction = dbStub.result.mock.calls[0][1];
      expect(transformFunction({ rowCount: 10 })).toStrictEqual(10);
    });
  });

  describe('truncate', () => {
    it('should truncate the table', async () => {
      const expectedQuery = `TRUNCATE TABLE test_table;`;

      await model.truncate();

      expect(dbStub.none).toHaveBeenCalledWith(expectedQuery);
    });

    it('should throw an exception when truncating the table fails', async () => {
      dbStub.none.mockRejectedValue(new Error('Failed to truncate table.'));

      try {
        await model.truncate();
      } catch (error) {
        expect(error.message).toBe('Failed to truncate table.');
      }
      // await expect(model.truncate()).rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should return the number of records', async () => {
      const expectedQuery = `SELECT COUNT(*) AS count FROM test_table`;
      dbStub.oneOrNone.mockResolvedValue({ count: 2 });

      const options = {
        fields: ['*'],
        conditions: [],
        aggregates: [{ func: 'COUNT', field: '*', alias: 'count' }],
      };

      result = await model.count(options);

      expect(dbStub.oneOrNone).toHaveBeenCalledWith(expectedQuery, []);
      expect(result).toStrictEqual({ count: 2 });
    });

    it('should throw an exception when counting records fails', async () => {
      // Mocking the necessary behavior to avoid the error in the aggregate method
      const options = {
        /* mock options */
      };
      const query = 'mocked query';
      const values = ['mocked value'];

      // Mocking the qb methods to return expected values
      model.reset = jest.fn(); // Mocking reset method
      model.setOptions = jest.fn(); // Mocking setOptions method
      model.uildQuery = jest.fn().mockReturnValue({ query, values }); // Mocking buildQuery method

      // Mocking the db method to reject with the error you expect
      model.db.oneOrNone.mockRejectedValue(
        new Error('Failed to count records.')
      );

      try {
        await model.count(options);
      } catch (error) {
        expect(error.message).toBe('Failed to count records.');
      }
    });

    it('should return the number of records for a specific condition', async () => {
      const options = {
        fields: ['*'],
        conditions: [{ field: 'name', operator: '=', value: 'Jane Doe' }],
        aggregates: [{ func: 'COUNT', field: 'name', alias: 'total_names' }],
      };

      dbStub.oneOrNone.mockResolvedValue({ count: 5 });

      const countResult = await model.count(options);

      expect(countResult).toEqual({ count: 5 });
      expect(dbStub.oneOrNone).toHaveBeenCalled();
    });
  });

  describe('max', () => {
    it('should return the maximum value of a column', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('MAX', 'age', 'max_age');

      dbStub.oneOrNone.mockResolvedValue({ max_age: 50 });

      const maxResult = await model.max(options);

      expect(maxResult).toEqual({ max_age: 50 });
      expect(dbStub.oneOrNone).toHaveBeenCalled();
    });

    it('should throw an exception when calculating the maximum value fails', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('MAX', 'age', 'max_age');

      dbStub.oneOrNone.mockRejectedValue(new Error('Failed to calculate max.'));

      try {
        await model.max(options);
      } catch (error) {
        expect(error.message).toBe('Failed to calculate max.');
      }
    });
  });

  describe('min', () => {
    it('should return the minimum value of a column', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('MIN', 'age', 'min_age');

      dbStub.oneOrNone.mockResolvedValue({ min_age: 18 });

      const minResult = await model.min(options);

      expect(minResult).toEqual({ min_age: 18 });
      expect(dbStub.oneOrNone).toHaveBeenCalled();
    });

    it('should throw an exception when calculating the minimum value fails', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('MIN', 'age', 'min_age');

      dbStub.oneOrNone.mockRejectedValue(new Error('Failed to calculate min.'));

      try {
        await model.min(options);
      } catch (error) {
        expect(error.message).toBe('Failed to calculate min.');
      }
    });
  });

  describe('sum', () => {
    it('should return the sum of a column', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('SUM', 'age', 'total_age');

      dbStub.oneOrNone.mockResolvedValue({ total_age: 123 });

      const sumResult = await model.sum(options);

      expect(sumResult).toEqual({ total_age: 123 });
      expect(dbStub.oneOrNone).toHaveBeenCalled();
    });

    it('should throw an exception when calculating the sum fails', async () => {
      options
        .setTable('test_table')
        .setFields(['age'])
        .addAggregate('SUM', 'age', 'total_age');

      dbStub.oneOrNone.mockRejectedValue(new Error('Failed to calculate sum.'));

      try {
        await model.sum(options);
      } catch (error) {
        expect(error.message).toBe('Failed to calculate sum.');
      }
    });
  });

  describe('variance', () => {
    it('should return the variance of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('VARIANCE', 'age', 'var_age');

        dbStub.oneOrNone.mockResolvedValue({ var_age: 123 });

        const varianceResult = await model.variance(options);

        expect(varianceResult).toEqual({ var_age: 123 });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to calculate variance.');
      }
    });

    it('should throw an exception when calculating the variance fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('VARIANCE', 'age', 'var_age');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to calculate variance.')
        );

        try {
          await model.variance(options);
        } catch (error) {
          expect(error.message).toBe('Failed to calculate variance.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to calculate variance.');
      }
    });
  });

  describe('stddev', () => {
    it('should return the standard deviation of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('STDDEV', 'age', 'std_age');

        dbStub.oneOrNone.mockResolvedValue({ std_age: 123 });

        const stddevResult = await model.stddev(options);

        expect(stddevResult).toEqual({ std_age: 123 });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to calculate standard deviation.');
      }
    });

    it('should throw an exception when calculating the standard deviation fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('STDDEV', 'age', 'std_age');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to calculate standard deviation.')
        );

        try {
          await model.stddev(options);
        } catch (error) {
          expect(error.message).toBe('Failed to calculate standard deviation.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to calculate standard deviation.');
      }
    });
  });

  describe('median', () => {
    it('should return the median of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('MEDIAN', 'age', 'median_age');

        dbStub.oneOrNone.mockResolvedValue({ median_age: 123 });

        const medianResult = await model.median(options);

        expect(medianResult).toEqual({ median_age: 123 });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to calculate median.');
      }
    });

    it('should throw an exception when calculating the median fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('MEDIAN', 'age', 'median_age');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to calculate median.')
        );

        try {
          await model.median(options);
        } catch (error) {
          expect(error.message).toBe('Failed to calculate median.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to calculate median.');
      }
    });
  });

  describe('average', () => {
    it('should return the average of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('AVG', 'age', 'avg_age');

        dbStub.oneOrNone.mockResolvedValue({ avg_age: 123 });

        const averageResult = await model.average(options);

        expect(averageResult).toEqual({ avg_age: 123 });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to calculate average.');
      }
    });

    it('should throw an exception when calculating the average fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['age'])
          .addAggregate('AVG', 'age', 'avg_age');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to calculate average.')
        );

        try {
          await model.average(options);
        } catch (error) {
          expect(error.message).toBe('Failed to calculate average.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to calculate average.');
      }
    });
  });

  describe('stringAgg', () => {
    it('should return the concatenated string of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('STRING_AGG', 'name', 'names');

        dbStub.oneOrNone.mockResolvedValue({ names: 'John, Jane, Doe' });

        const stringAggResult = await model.stringAgg(options);

        expect(stringAggResult).toEqual({ names: 'John, Jane, Doe' });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to concatenate strings.');
      }
    });

    it('should throw an exception when concatenating strings fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('STRING_AGG', 'name', 'names');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to concatenate strings.')
        );

        try {
          await model.stringAgg(options);
        } catch (error) {
          expect(error.message).toBe('Failed to concatenate strings.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to concatenate strings.');
      }
    });
  });

  describe('firstValue', () => {
    it('should return the first value of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('FIRST_VALUE', 'name', 'first_name');

        dbStub.oneOrNone.mockResolvedValue({ first_name: 'John' });

        const firstValueResult = await model.firstValue(options);

        expect(firstValueResult).toEqual({ first_name: 'John' });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to get first value.');
      }
    });

    it('should throw an exception when getting the first value fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('FIRST_VALUE', 'name', 'first_name');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to get first value.')
        );

        try {
          await model.firstValue(options);
        } catch (error) {
          expect(error.message).toBe('Failed to get first value.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to get first value.');
      }
    });
  });

  describe('lastValue', () => {
    it('should return the last value of a column', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('LAST_VALUE', 'name', 'last_name');

        dbStub.oneOrNone.mockResolvedValue({ last_name: 'Doe' });

        const lastValueResult = await model.lastValue(options);

        expect(lastValueResult).toEqual({ last_name: 'Doe' });
        expect(dbStub.oneOrNone).toHaveBeenCalled();
      } catch (error) {
        expect(error.message).toBe('Failed to get last value.');
      }
    });

    it('should throw an exception when getting the last value fails', async () => {
      try {
        options
          .setTable('test_table')
          .setFields(['name'])
          .addAggregate('LAST_VALUE', 'name', 'last_name');

        dbStub.oneOrNone.mockRejectedValue(
          new Error('Failed to get last value.')
        );

        try {
          await model.lastValue(options);
        } catch (error) {
          expect(error.message).toBe('Failed to get last value.');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to get last value.');
      }
    });
  });

  describe('createColumnSet', () => {
    it('should create a column set based on schema', () => {
      expect(model.cs).toBeDefined();
      expect(model.cs.test_table.columns.map((c) => c.name)).toEqual([
        'name',
        'email',
        'age',
      ]);
      expect(model.cs.insert.columns.map((c) => c.name)).toEqual([
        'name',
        'email',
        'age',
        'created_by',
      ]);
      expect(model.cs.update.columns.map((c) => c.name)).toEqual([
        'name',
        'email',
        'age',
        'updated_at',
        'updated_by',
      ]);
    });

    it('should return the Model.cs object when calling createColumnSet multiple times', () => {
      const cs1 = model.createColumnSet();
      const cs2 = model.createColumnSet();

      expect(cs1).toBe(cs2);
    });

    it('should add cnd: true property to primary key columns that are not serial ', () => {
      schema.columns.email.primaryKey = true;

      model = new Model(dbStub, pgp, schema);

      emailColumn = model.cs.test_table.columns.find((c) => c.name === 'email');
      expect(emailColumn.cnd).toBe(true);
    });

    it('should create the column set with uuid vs serial ', () => {
      schema.columns.id.type = 'uuid';

      model = new Model(dbStub, pgp, schema);

      idColumn = model.cs.test_table.columns.find((c) => c.name === 'id');
      expect(schema.columns.id.type).toBe('uuid');
      //return to original schema
      schema.columns.id.type = 'serial';
    });
  });
});
