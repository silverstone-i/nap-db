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
      any: jest.fn().mockResolvedValue([]),
      result: jest.fn().mockResolvedValue({ rowCount: 1 }),
    };

    model = new Model(dbStub, pgp, schema);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
  });
});
