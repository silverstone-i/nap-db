// test/Model.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Model = require('../db/Model'); // Import your Model class
const pgPromise = require('pg-promise');

const schema2 = {
    tableName: 'users',
    fields: [
        {
            name: 'id',
            type: 'serial',
            primary: true,
        },
        {
            name: 'email',
        },
        {
            name: 'password',
        },
        {
            name: 'employee_id',
        },
        {
            name: 'full_name',
        },
        {
            name: 'role',
        },
        {
            name: 'created_at',
            useDefault: true,
        },
        {
            name: 'created_by',
        },
        {
            name: 'last_modified',
            useDefault: true,
        },
        {
            name: 'last_modified_by',
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
    let model;

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
        model = new Model(dbStub, pgpSpy, schema2);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should format the prepared statement correctly for insert', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ('joe@gmail.com', 'hopeidontgethacked', 123, 'Joe Picket', 'user', 'Joe Picket', 'Joe Picket');`;

        // Perform the action that triggers the database query
        const result = await model.insert(DTO);

        // Verify the behavior and capture the value of preparedQuery
        const preparedQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(preparedQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find all', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT * FROM users;`;
        // Perform the action that triggers the database query
        const result = await model.find();

        // Verify the behavior and capture the value of preparedQuery
        const preparedQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(preparedQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find one or none', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT * FROM users WHERE id = '1'`;
        // Perform the action that triggers the database query
        const result = await model.find('id', 1);

        // Verify the behavior and capture the value of preparedQuery
        const preparedQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(preparedQuery, expectedQuery);
    });

    it('should format the prepared statement correctly for update', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `UPDATE users SET email = 'joe@gmail.com', password = 'hopeidontgethacked', employee_id = 123, full_name = 'Joe Picket', role = 'user', last_modified_by = 'Joe Picket' WHERE id = 1;`;
        // Perform the action that triggers the database query
        const result = await model.update(DTO);

        // Verify the behavior and capture the value of preparedQuery
        const preparedQuery = pgpSpy.as.format.firstCall?.returnValue;
        expect(preparedQuery).to.equal(expectedQuery);
    });
});
