// test/Model.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Model = require('../db/Model'); // Import your Model class
const pgPromise = require('pg-promise');

const schema2 = {
    tableName: 'users',
    columns: [
        {
            name: 'id',
            type: 'serial',
            primary: true,
        },
        {
            name: 'email',
            type: 'varchar',
            length: 255,
            unique: true,
            notNull: true,
        },
        {
            name: 'password',
            type: 'varchar',
            length: 50,
            notNull: true,
        },
        {
            name: 'employee_id',
            type: 'int4',
            notNull: true,
        },
        {
            name: 'full_name',
            type: 'varchar',
            length: 50,
            notNull: true,
        },
        {
            name: 'role',
            type: 'varchar',
            length: 25,
            notNull: true,
        },
        {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            useDefault: true,
        },
        {
            name: 'created_by',
            type: 'varchar',
            length: 25,
            notNull: true,
        },
        {
            name: 'last_modified_at',
            useDefault: true,
            type: 'timestamptz',
        },
        {
            name: 'last_modified_by',
            type: 'varchar',
            length: 25,
            notNull: true,
        },
    ],
    foreignKeys: [
        {
            hasRelations: [
                {
                    name: 'employee_id',
                },
            ],
            withColumns: [
                {
                    name: 'id',
                },
            ],
            withTable: 'employees',
        },
    ],
};

const DTO = {
    id: 1,
    email: 'joe@gmail.com',
    password: 'hopeidontgethacked',
    employee_id: 123,
    full_name: 'Joe Picket',
    role: 'user',
    created_by: 'Joe Picket',
    last_modified_by: 'Joe Picket',
};

describe('Model Testing', () => {
    let pgp;
    let pgpSpy;
    let model = undefined;
    let dbStub;

    beforeEach(() => {
        // Create a spy for pgp.as.format
        pgp = pgPromise();
        pgpSpy = {
            as: {
                format: sinon.spy(pgp.as, 'format'),
            },
        };

        // Create a stub for the database
        dbStub = {
            none: sinon.stub().resolves(),
            one: sinon.stub().resolves(),
            oneOrNone: sinon.stub().resolves(null),
            any: sinon.stub().resolves([]),
        };

        // Create a new instance of the Model class
        model = new Model(dbStub, pgp, schema2)
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should format the prepared statement correctly for insert', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ('joe@gmail.com', 'hopeidontgethacked', 123, 'Joe Picket', 'user', 'Joe Picket', 'Joe Picket');`;

        // Perform the action that triggers the database query
        const result = await model.insert(DTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find all', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT * FROM users;`;
        // Perform the action that triggers the database query
        const result = await model.find();

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find one or none', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT * FROM users WHERE email = 'joe@gmail.com'`;
        // Perform the action that triggers the database query
        const result = await model.find('email', 'joe@gmail.com');

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery, expectedQuery);
    });

    it('should format the prepared statement correctly for update', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `UPDATE users SET email = 'joe@gmail.com', password = 'hopeidontgethacked', employee_id = 123, full_name = 'Joe Picket', role = 'user', last_modified_by = 'Joe Picket' WHERE id = 1;`;
        // Perform the action that triggers the database query
        const result = await model.update(DTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall?.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for delete all', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `DELETE * FROM users;`;
        // Perform the action that triggers the database query
        const result = await model.delete();

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for delete by PRIMARY KEY', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `DELETE * FROM users WHERE id = '1'`;
        // Perform the action that triggers the database query
        const result = await model.delete(1);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery, expectedQuery);
    });

    it('should format the prepared statement correctly for CREATE TABLE', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `CREATE TABLE users (
            id serial PRIMARY KEY,
            email varchar(255) UNIQUE NOT NULL,
            password varchar(50) NOT NULL,
            employee_id int4 NOT NULL,
            full_name varchar(50) NOT NULL,
            role varchar(25) NOT NULL,
            created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
            created_by varchar(25) NOT NULL,
            last_modified timestamptz,
            last_modified_by varchar(25) NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
            );`;
        // Perform the action that triggers the database query
        const result = await model.createTable();

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery, expectedQuery);
    });
});
