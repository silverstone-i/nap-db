// test/Model.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Model = require('../db/Model'); // Import your Model class
const pgPromise = require('pg-promise');
const { createColumnsets } = require('../db/nap');
const { QueryFile } = require('pg-promise');

const DTO = {
    email: 'joe@gmail.com',
    password: 'donthackme',
    employee_id: 123,
    full_name: 'Joe Picket',
    role: 'admin',
    active: true,
    created_by: 'Joe Picket',
};

const updateDTO = {
    email: 'joe@gmail.com',
    password: 'donthackme',
    role: 'user',
    updated_by: 'Joe Picket',
};

const findDTO = {
    email: true,
    full_name: true,
    employee_id: true,
};

describe('Model Testing', () => {
    let pgp;
    let pgpSpy;
    let model = undefined;
    let dbStub;

    beforeEach(() => {
        schema2 = {
            tableName: 'users',
            columns: [
                {
                    name: 'email',
                    type: 'varchar',
                    length: 255,
                    primary: true,
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
                    name: 'active',
                    type: 'bool',
                    notNull: true,
                    default: true,
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

        // Create a spy for pgp.as.format
        pgp = pgPromise({ capSQL: true });
        pgpSpy = {
            as: {
                format: sinon.spy(pgp.as, 'format'),
            },
            helpers: {
                insert: sinon.spy(pgp.helpers, 'insert'),
                update: sinon.spy(pgp.helpers, 'update'),
            },
        };

        // Create a stub for the database
        dbStub = {
            none: sinon.stub().resolves(),
            one: sinon.stub().resolves(),
            oneOrNone: sinon.stub().resolves(null),
            any: sinon.stub().resolves([]),
            result: sinon.stub().resolves(1),
        };

        // Create a new instance of the Model class
        model = new Model(dbStub, pgp, schema2);
        const cs = model.createColumnsets();
        model.setColumnsets(cs);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should format the prepared statement correctly for insert', async () => {
        const expectedQuery = `INSERT INTO "public"."users"("email","password","employee_id","full_name","role","active","created_by") VALUES('joe@gmail.com','donthackme',123,'Joe Picket','admin',true,'Joe Picket')`;

        // Perform the action that triggers the database query
        const result = await model.insert(DTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.helpers.insert.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find all', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT "email","full_name","employee_id" FROM users`;
        // Perform the action that triggers the database query
        const result = await model.findAll(findDTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find one or none', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT "email","full_name","employee_id" FROM users WHERE "email" = 'joe@gmail.com';`;
        // Perform the action that triggers the database query
        const result = await model.findWhere(findDTO, 'email', 'joe@gmail.com');

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for update', async () => {
        const expectedCondition = ` WHERE email = 'joe@gmail.com';`;
        const expectedQuery = `UPDATE "public"."users" SET "password"='donthackme',"role"='user',"updated_at"=CURRENT_TIMESTAMP,"updated_by"='Joe Picket'`;
        // Perform the action that triggers the database query
        const result = await model.update(updateDTO);

        // Verify the behavior and capture the value of actualQuery
        const actualCondition = pgpSpy.as.format.firstCall.returnValue;
        const actualQuery = pgpSpy.helpers.update.firstCall?.returnValue;
        expect(actualCondition).to.equal(expectedCondition);
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for delete by PRIMARY KEY', async () => {
        const expectedQuery = `DELETE FROM users WHERE email = 'lana@gmail.com'`;
        // Perform the action that triggers the database query
        const result = await model.purge('lana@gmail.com');

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery, expectedQuery);
    });

    it('should format the prepared statement correctly for CREATE TABLE', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `CREATE TABLE users ( email varchar(255) PRIMARY KEY, password varchar(50) NOT NULL, employee_id int4 NOT NULL, full_name varchar(50) NOT NULL, role varchar(25) NOT NULL, active bool NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(50) NOT NULL, updated_at timestamptz, updated_by varchar(50), FOREIGN KEY (employee_id) REFERENCES employees(id) );`;

        // Create a spy for writeCreateTableFile and mock the return value
        const writeCreateTableFileSpy = sinon.spy(
            model,
            'writeCreateTableFile'
        );
            
        // Call the createTable method
        await model.createTable();

        // Verify the behavior
        sinon.assert.calledOnce(writeCreateTableFileSpy);
        sinon.assert.calledWithExactly(writeCreateTableFileSpy);

        // Access the return value
        const qfPromise = writeCreateTableFileSpy.returnValues[0];
        const qf = await qfPromise;
        const inputText = qf.toString();

        // Extract the CREATE TABLE statement using regex
        const regex = /CREATE TABLE[^;]+;/;
        const match = inputText.match(regex);

        if (!match) console.log("CREATE TABLE statement not found."); 
        
        const actualQuery = match[0];

        expect(actualQuery).to.equal(expectedQuery);

        // Restore the original function
        writeCreateTableFileSpy.restore();
    });
});
