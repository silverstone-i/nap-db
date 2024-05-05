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
  let model;
  beforeAll(() => {
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
      result: jest.fn().mockResolvedValue(1),
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

      await expect(model.insert(dto)).rejects.toThrow();
    });
  });

  // describe('update', () => {
  //   it('should update a record', async () => {
  //     const data = {
  //       name: 'Jane Doe',
  //       email: 'jane@doe.com',
  //       age: 25,
  //     };
  //     const result = await model.update(1, data);
  //     expect(result).toEqual({ id: 1, ...data });
  //   });
  // });

  // describe('delete', () => {
  //   it('should delete a record', async () => {
  //     const result = await model.delete(1);
  //     expect(result).toEqual(1);
  //   });
  // });
});
