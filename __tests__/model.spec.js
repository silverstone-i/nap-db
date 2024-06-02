const pgp = require('pg-promise')({ capSQL: true });
const db = require('../db/DB').db;
const Model = require('../db/Model');
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

  beforeEach(() => {
    jest.clearAllMocks();

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

  describe('createTableInDB', () => {
    it('should create a table based on schema - no foreign keys or unique constraints', async () => {
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by varchar(50) NOT NULL,updated_at timestamptz NULL DEFAULT NULL,updated_by varchar(50) NULL DEFAULT NULL);`;

      await model.createTableInDB();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(
        /\s*([.,;:])\s*|\s{2,}|\n/g,
        '$1'
      );

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with foreign keys and no unique constraints', async () => {
      model.schema.foreignKeys = {
        fk_test_table: {
          referenceTable: 'test_table2',
          referenceColumns: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by varchar(50) NOT NULL,updated_at timestamptz NULL DEFAULT NULL,updated_by varchar(50) NULL DEFAULT NULL,FOREIGN KEY (fk_test_table) REFERENCES test_table2(id) ON DELETE CASCADE ON UPDATE CASCADE);`;

      await model.createTableInDB();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(/\r?\n|\r/g, '');

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with unique constraints and no foreign keys', async () => {
      model.schema.uniqueConstraints = {
        uq_test_table: {
          columns: ['name', 'email'],
        },
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by varchar(50) NOT NULL,updated_at timestamptz NULL DEFAULT NULL,updated_by varchar(50) NULL DEFAULT NULL,CONSTRAINT uq_test_table UNIQUE (name,email));`;

      await model.createTableInDB();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(/\r?\n|\r/g, '');

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should create a table based on schema - with foreign keys and unique constraints', async () => {
      model.schema.foreignKeys = {
        fk_test_table: {
          referenceTable: 'test_table2',
          referenceColumns: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      };
      model.schema.uniqueConstraints = {
        uq_test_table: {
          columns: ['name', 'email'],
        },
      };

      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by varchar(50) NOT NULL,updated_at timestamptz NULL DEFAULT NULL,updated_by varchar(50) NULL DEFAULT NULL,FOREIGN KEY (fk_test_table) REFERENCES test_table2(id) ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT uq_test_table UNIQUE (name,email));`;

      await model.createTableInDB();

      const mockReceived = dbStub.none.mock.calls[0][0];
      const normalizedReceived = mockReceived.replace(/\r?\n|\r/g, '');

      expect(normalizedReceived).toMatch(expectedQuery);
    });

    it('should throw an exception when creating a table fails', async () => {
      dbStub.none.mockRejectedValue(new Error('Failed to create table.'));

      try {
        await model.createTableInDB();
      } catch (error) {
        expect(error.message).toBe('Failed to create table.');
      }
    });

    it('calling Model.createTableQuery should generate the create table SQL', () => {
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18,created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,created_by varchar(50) NOT NULL,updated_at timestamptz NULL DEFAULT NULL,updated_by varchar(50) NULL DEFAULT NULL);`;

      const actualQuery = model.createTableQuery().replace(/\r?\n|\r/g, '');

      expect(actualQuery).toBe(expectedQuery);
    });

    it('should not generate timeStamps columns when schema.timeStamps is false', () => {
      model.schema.timeStamps = false;
      const expectedQuery = `CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY NOT NULL,name varchar(255) NOT NULL,email varchar(255) NOT NULL,age integer DEFAULT 18);`;

      const actualQuery = model.createTableQuery().replace(/\r?\n|\r/g, '');

      expect(actualQuery).toBe(expectedQuery);
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

  describe('select', () => {
    it('should return all records', async () => {
      const expectedQuery = `SELECT * FROM test_table ;`;

      const result = await model.select({});

      expect(result).toBe(selectAll);
      expect(dbStub.any).toHaveBeenCalledWith(expectedQuery);
    });

    it('should return all fields for records that match the condition', async () => {
      const selected = [
        {
          id: 2,
          name: 'Jane Doe',
          email: 'jane@doe.com',
          age: 25,
          created_by: 'Admin',
        },
      ];

      dbStub.any.mockResolvedValue(selected);
      const dto = {
        name: 'Jane Doe',
        _condition: 'WHERE name = ${name}',
      };
      const dtoSansCondition = { name: 'Jane Doe' };
      const expectedCondition = "WHERE name = 'Jane Doe'";
      const expectedQuery = `SELECT * FROM test_table WHERE name = 'Jane Doe';`;

      const result = await model.select(dto);

      expect(pgpSpy.as.format.mock.results[0].value).toBe(expectedCondition);
      expect(result).toBe(selected);
      expect(dbStub.any).toHaveBeenCalledWith(expectedQuery);
    });

    it('should return selected fields for records that match the condition', async () => {
      const selected = [
        {
          email: 'jane@doe.comm',
          age: 25,
        },
      ];

      dbStub.any.mockResolvedValue(selected);

      const dto = {
        name: 'Jane Doe',
        email: '',
        age: '',
        _condition: 'WHERE name = ${name}',
      };

      const dtoSansCondition = { name: 'Jane Doe' };

      const expectedCondition = "WHERE name = 'Jane Doe'";
      const expectedQuery = `SELECT "email","age" FROM test_table WHERE name = 'Jane Doe';`;

      const result = await model.select(dto);

      expect(pgpSpy.as.format.mock.results[0].value).toBe(expectedCondition);
      expect(result).toBe(selected);
      expect(dbStub.any).toHaveBeenCalledWith(expectedQuery);
    });

    it('should throw an exception when selecting records without a condition', async () => {
      const dto = {
        name: 'Jane Doe',
      };

      try {
        await model.select(dto);
      } catch (error) {
        expect(error.message).toBe('SELECT requires a condition');
      }
      // await expect(model.select(dto)).rejects.toThrow();
    });

    it('should throw an exception when no records are found', async () => {
      const dto = {
        name: 'Jane Doe',
        _condition: 'WHERE name = ${name}',
      };

      dbStub.any.mockResolvedValue([]);

      try {
        await model.select(dto);
      } catch (error) {
        expect(error.message).toBe('No records found.');
      }
      // await expect(model.select(dto)).rejects.toThrow();
    });

    it('should throw an exception when selecting records fails', async () => {
      const dto = {
        name: 'Jane Doe',
        _condition: 'WHERE name = ${name}',
      };

      dbStub.any.mockRejectedValue(new Error('Failed to select records.'));

      try {
        await model.select(dto);
      } catch (error) {
        expect(error.message).toBe('Failed to select records.');
      }
      // await expect(model.select(dto)).rejects.toThrow();
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
      const expectedQuery = `SELECT COUNT(*) FROM test_table;`;
      dbStub.one.mockResolvedValue({ count: 2 });

      result = await model.count();

      expect(dbStub.one).toHaveBeenCalledWith(
        expectedQuery,
        expect.any(Function)
      );
      expect(result).toStrictEqual({ count: 2 });
    });

    it('should throw an exception when counting records fails', async () => {
      dbStub.one.mockRejectedValue(new Error('Failed to count records.'));

      try {
        await model.count();
      } catch (error) {
        expect(error.message).toBe('Failed to count records.');
      }
      // await expect(model.count()).rejects.toThrow();
    });

    it('should correctly transform the result using (a) => +a.count', async () => {
      dbStub.one.mockResolvedValue({ count: '5' });
      const result = await model.count();
      expect(result).toStrictEqual({ count: '5' });
      expect(dbStub.one).toHaveBeenCalledWith(
        `SELECT COUNT(*) FROM ${model.schema.tableName};`,
        expect.any(Function)
      );

      // Check the transformation function directly
      const transformFunction = dbStub.one.mock.calls[0][1];
      expect(transformFunction({ count: '10' })).toStrictEqual(10);
    });

    it('should return the number of records for a specific condition', async () => {
      const dto = {
        name: 'Jane Doe',
        _condition: 'WHERE name = ${name}',
      };
      const expectedCondition = "WHERE name = 'Jane Doe'";
      const expectedQuery = `SELECT COUNT(*) FROM test_table WHERE name = 'Jane Doe';`;
      dbStub.one.mockResolvedValue({ count: 1 });

      await model.count(dto);

      expect(pgpSpy.as.format.mock.results[0].value).toBe(expectedCondition);
      expect(dbStub.one).toHaveBeenCalledWith(
        expectedQuery,
        expect.any(Function)
      );
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
  });
});
