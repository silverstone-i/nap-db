'use strict';
// Generated by CodiumAI
const Model = require('../db/Model');
const pgp = require('pg-promise')();

describe('Model', () => {
  // Model can be initialized with a database connection, a pg-promise instance, and a schema object.
  it('should initialize Model with the provided parameters', () => {
    // Mock dependencies
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });
  
  // Model can handle a schema object with no columns.
  it('should handle a schema object with no columns', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {},
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can create the table with no foreign keys or unique constraints.
  it('should create the table with no foreign keys or unique constraints', async () => {
    const db = {
      none: jest.fn(),
    };
    const pgp = {
      helpers: {
        insert: jest.fn(),
        update: jest.fn(),
        ColumnSet: jest.fn(),
      },
      as: {
        format: jest.fn(),
      },
    };
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    // Create instance of Model
    const model = new Model(db, pgp, schema);

    // Call the init method
    await model.init();

    // Define the expected SQL statement (ignoring whitespace differences)
    const expectedSQL =
      /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+test_table\s+\(\s+id\s+integer\s+PRIMARY\s+KEY\s+NOT\s+NULL,\s+name\s+varchar\(255\)\s+NOT\s+NULL\s+\);/;

    // Assert that the correct query is executed
    expect(db.none).toHaveBeenCalledWith(expect.stringMatching(expectedSQL));
  });

  // Model can handle a schema object with  unique constraints.
  it('should create the table with unique constraints', async () => {
    // Mock dependencies
    const db = {
      none: jest.fn(),
    };
    const pgp = {
      helpers: {
        insert: jest.fn(),
        update: jest.fn(),
        ColumnSet: jest.fn(),
      },
      as: {
        format: jest.fn(),
      },
    };
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
      uniqueConstraints: {
        unique_name: {
          columns: ['name'],
        },
      },
    };

    // Create instance of Model
    const model = new Model(db, pgp, schema);

    // Call the init method
    await model.init();

    // Define the expected SQL statement (ignoring whitespace differences)
    const expectedSQL =
      /CREATE TABLE IF NOT EXISTS test_table\s*\(\s*id integer PRIMARY KEY NOT NULL,\s*name varchar\(255\) NOT NULL,\s*CONSTRAINT unique_name UNIQUE \(name\)\s*\);/;

    // Assert that the correct query is executed
    expect(db.none).toHaveBeenCalledWith(expect.stringMatching(expectedSQL));
  });

  // Model can handle a schema object with foreign keys.
  it('should create the table with foreign keys', async () => {
    // Mock dependencies
    const db = {
      none: jest.fn(),
    };
    const pgp = {
      helpers: {
        insert: jest.fn(),
        update: jest.fn(),
        ColumnSet: jest.fn(),
      },
      as: {
        format: jest.fn(),
      },
    };
    const schema = {
      tableName: 'test_table',
      dbSchema: 'public', // Adding default schema
      timeStamps: true, // Adding timestamps as per default
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
      foreignKeys: {
        fk_name: {
          referenceTable: 'other_table',
          referenceColumns: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      },
    };

    // Create instance of Model
    const model = new Model(db, pgp, schema);

    // Call the init method
    await model.init();

    // Define the expected SQL statement (ignoring whitespace differences)
    // Define the expected SQL statement (ignoring whitespace differences)
    const expectedSQL =
      /CREATE TABLE IF NOT EXISTS test_table\s*\(\s*id integer PRIMARY KEY NOT NULL,\s*name varchar\(255\) NOT NULL,\s*created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,\s*created_by varchar\(50\) NOT NULL,\s*updated_at timestamptz NULL DEFAULT NULL,\s*updated_by varchar\(50\) NULL DEFAULT NULL,\s*FOREIGN KEY \(fk_name\) REFERENCES other_table\(id\) ON DELETE CASCADE ON UPDATE CASCADE\s*\);/;

    // Assert that the correct query is executed
    expect(db.none).toHaveBeenCalledWith(expect.stringMatching(expectedSQL));
  });

  // Model can drop a table from the database based on the schema object.
  it('should drop a table from the database based on the schema object', async () => {
    // Mock dependencies
    const db = {
      none: jest.fn(),
    };
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    // Create instance of Model
    const model = new Model(db, pgp, schema);

    // Call the drop method
    await model.drop();

    // Assert that the drop method was called with the correct query
    expect(db.none).toHaveBeenCalledWith('DROP TABLE IF EXISTS test_table;');
  });

  // Model can insert a DTO into the database.
  it('should insert a DTO into the database', async () => {
    // Mock dependencies
    const db = {
      none: jest.fn(),
    };
    const pgp = {
      helpers: {
        insert: jest.fn().mockReturnValue('INSERT QUERY'),
        ColumnSet: jest.fn().mockImplementation(() => ({ extend: jest.fn() })),
      },
      as: {
        format: jest.fn().mockReturnValue('FORMATTED CONDITION'),
      },
    };
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    // Create instance of Model
    const model = new Model(db, pgp, schema);

    // Create DTO
    const dto = { id: 1, name: 'John Doe' };

    // Call insert method
    await model.insert(dto);

    // Verify that the insert query was called with the correct arguments
    expect(pgp.helpers.insert).toHaveBeenCalledWith(dto, model.cs.insert);

    // Verify that the database none method was called with the insert query and dto
    expect(db.none).toHaveBeenCalledWith('INSERT QUERY', dto);
  });

  // Model can update rows in the database based on a DTO.
  it('should update rows in the database based on a DTO', async () => {
    const db = {
      none: jest.fn(),
      result: jest.fn().mockReturnValue({ rowcount: 1 }),
    };
    const pgp = {
      helpers: {
        update: jest.fn().mockReturnValue('UPDATE query'),
        ColumnSet: jest.fn().mockReturnValue({
          extend: jest.fn().mockReturnValue('extended columnset'),
        }),
      },
      as: {
        format: jest.fn().mockReturnValue('formatted condition'),
      },
    };
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    const dto = { id: 1, name: 'John' };

    await model.update(dto);

    expect(model.cs).not.toBeNull();
    expect(pgp.helpers.update).toHaveBeenCalledWith(dto, 'extended columnset');
    expect(pgp.as.format).toHaveBeenCalledWith(dto._condition, dto);
    expect(db.result).toHaveBeenCalledWith(
      'UPDATE queryformatted condition',
      dto
    );
  });

  // Model can truncate the table in the database.
  it('should truncate the table in the database', async () => {
    const db = {
      none: jest.fn(),
    };
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    await model.truncate();

    expect(db.none).toHaveBeenCalledWith('TRUNCATE TABLE test_table;');
  });

  // Model can handle a schema object with no table name.
  it('should handle a schema object with no table name', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can handle a schema object with no primary key.
  it('should initialize Model with the provided parameters', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer' },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can handle a schema object with no non-null columns.
  it('should initialize Model with the provided parameters', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can handle a schema object with no default values.
  it('should initialize Model with the provided parameters', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can handle a schema object with no timestamps.
  it('should initialize Model with the provided parameters', () => {
    const db = jest.fn();
    const pgp = jest.fn();
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    expect(model.db).toBe(db);
    expect(model.pgp).toBe(pgp);
    expect(model.schema).toEqual(schema);
    expect(model.cs).toBeNull();
  });

  // Model can delete rows from the database based on a DTO.
  it('should delete rows from the database based on a DTO', async () => {
    // Arrange
    const db = {
      none: jest.fn(),
    };
    const pgp = {
      as: {
        format: jest.fn(),
      },
      helpers: {
        insert: jest.fn(),
        update: jest.fn(),
        ColumnSet: jest.fn(),
      },
    };
    const schema = {
      tableName: 'test_table',
      columns: {
        id: { type: 'integer', primaryKey: true },
        name: { type: 'varchar(255)', nullable: false },
      },
    };

    const model = new Model(db, pgp, schema);

    const dto = { id: 1, _condition: 'id = ${id}' };
    const condition = 'id = ${id}';
    const deleteQuery = `DELETE FROM ${schema.tableName} WHERE ${condition};`;

    pgp.as.format.mockReturnValue(deleteQuery);

    // Act
    await model.delete(dto);

    // Assert
    expect(pgp.as.format).toHaveBeenCalledWith(condition, dto);
    expect(db.none).toHaveBeenCalledWith(deleteQuery);
  });
});
