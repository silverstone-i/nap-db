// @ts-nocheck
/* eslint-disable no-undef */
// test/Model.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const Model = require('../db/Model'); // Import your Model class
const pgPromise = require('pg-promise');
const { createColumnsets } = require('../db/nap');
const { QueryFile } = require('pg-promise');
const fs = require('fs');
const path = require('path');

function deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call for directories
                deleteDirectory(curPath);
            } else {
                // Delete file
                fs.unlinkSync(curPath);
            }
        });
        // Delete the empty directory
        fs.rmdirSync(directoryPath);
    } else {
        console.log('Directory not found:', directoryPath);
    }
}

function findStringDifferenceIndex(string1, string2) {
    const minLength = Math.min(string1.length, string2.length);

    for (let i = 0; i < minLength; i++) {
        if (string1[i] !== string2[i]) {
            return i;
        }
    }

    // If all characters checked so far are the same, but the strings have different lengths,
    // return the index corresponding to the length of the shorter string.
    if (string1.length !== string2.length) {
        return minLength;
    }
}

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
    _condition: 'WHERE email = ${email};',
};

const findDTO = {
    email: 'Joe Picket',
    full_name: '',
    employee_id: '',
};

const whereDTO = {
    email: 'Joe Picket',
    full_name: '',
    employee_id: '',
    _condition: 'WHERE email = ${email}',
};

describe('Model Testing - Single Primary Key', () => {
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
            primaryKeys: [
                { name: 'email' },
                // { name: 'password'}
            ],
            // foreignKeys: [
            //     {
            //         hasRelations: [
            //             {
            //                 name: 'employee_id',
            //             },
            //             {
            //                 name: 'password'
            //             },
            //         ],
            //         withColumns: [
            //             {
            //                 name: 'id',
            //             },
            //             {
            //                 name: 'employee'
            //             },
            //         ],
            //         withTable: 'employees',
            //         onDeleteAction: 'CASCADE',
            //         onUpdateAction: 'CASCADE',
            //     },
            // ],
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
        const expectedQuery = `SELECT "email","full_name","employee_id" FROM users `;
        // Perform the action that triggers the database query
        const result = await model.find(findDTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly with a WHERE clause', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT "email","full_name","employee_id" FROM users WHERE email = 'Joe Picket'`;
        // Perform the action that triggers the database query
        const result = await model.find(whereDTO);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery =
            pgpSpy.as.format.secondCall.returnValue +
            pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for update', async () => {
        const expectedCondition = `WHERE email = 'joe@gmail.com';`;
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
        const dto = {
            email: 'lana@gmail.com',
            _condition: 'WHERE email = ${email};',
        }

        const expectedQuery = `WHERE email = 'lana@gmail.com';`;
        // Perform the action that triggers the database query
        const result = await model.delete(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for CREATE TABLE', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `CREATE TABLE users ( email varchar(255), password varchar(50) NOT NULL, employee_id int4 NOT NULL, full_name varchar(50) NOT NULL, role varchar(25) NOT NULL, active bool NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(50) NOT NULL, updated_at timestamptz, updated_by varchar(50), PRIMARY KEY (email) );`;

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

        if (!match) console.log('CREATE TABLE statement not found.');

        const actualQuery = match[0];

        expect(actualQuery).to.equal(expectedQuery);

        const cwd = process.cwd();
        const delPath = path.join(cwd, 'db/sql');
        deleteDirectory(delPath);

        // Restore the original function
        writeCreateTableFileSpy.restore();
    });
});

describe('Model Testing - Multiple Primary Keys', () => {
    let pgp;
    let pgpSpy;
    let model = undefined;
    let dbStub;

    beforeEach(() => {
        const accountSchema = {
            tableName: 'accounts',
            columns: [
                {
                    name: 'company_id',
                    type: 'varchar',
                    length: 3,
                },
                {
                    name: 'account_id',
                    type: 'varchar',
                    length: 20,
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: 50,
                    notNull: true,
                },
                {
                    name: 'description',
                    type: 'varchar',
                    length: 255,
                },
                {
                    name: 'active',
                    type: 'boolean',
                    notNull: true,
                    useDefault: true,
                    default: true,
                },
            ],
            primaryKeys: [{ name: 'company_id' }, { name: 'account_id' }],
        };

        // Create a spy for pgp.as.format and pgp.helpers
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
        model = new Model(dbStub, pgp, accountSchema);
        const cs = model.createColumnsets();
        model.setColumnsets(cs);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should format the prepared statement correctly for insert', async () => {
        const dto = {
            company_id: '000',
            account_id: '1.1.10000',
            name: 'Cash 1',
            description: '',
            active: true,
            created_by: 'nap-admin',
        };

        const expectedQuery = `INSERT INTO "public"."accounts"("company_id","account_id","name","description","active","created_by") VALUES('000','1.1.10000','Cash 1','',true,'nap-admin')`;

        // Perform the action that triggers the database query
        const result = await model.insert(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.helpers.insert.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for find all', async () => {
        const dto = {
            company_id: '000',
            account_id: '1.1.10000',
            name: 'Cash 1',
            active: true,
        };

        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT "company_id","account_id","name","active" FROM accounts `;
        // Perform the action that triggers the database query
        const result = await model.find(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly with a WHERE clause', async () => {
        const dto = {
            company_id: '000',
            account_id: '1.1.10000',
            name: 'Cash 1',
            active: true,
            _condition:
                'WHERE company_id = ${company_id} AND account_id = ${account_id};',
        };

        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `SELECT "company_id","account_id","name","active" FROM accounts WHERE company_id = '000' AND account_id = '1.1.10000';`;
        // Perform the action that triggers the database query
        const result = await model.find(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery =
            pgpSpy.as.format.secondCall.returnValue +
            pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for update', async () => {
        const dto = {
            company_id: '000',
            account_id: '1.1.10000',
            active: false,
            updated_by: 'nap-admin',
            _condition:
                'WHERE company_id = ${company_id} AND account_id = ${account_id};',
        };
        const expectedCondition = `WHERE company_id = '000' AND account_id = '1.1.10000';`;
        const expectedQuery = `UPDATE "public"."accounts" SET "active"=false,"updated_at"=CURRENT_TIMESTAMP,"updated_by"='nap-admin'`;
        // Perform the action that triggers the database query
        const result = await model.update(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualCondition = pgpSpy.as.format.firstCall.returnValue;
        const actualQuery = pgpSpy.helpers.update.firstCall?.returnValue;
        expect(actualCondition).to.equal(expectedCondition);
        expect(actualQuery).to.equal(expectedQuery);
    });

    it('should format the prepared statement correctly for delete by PRIMARY KEY', async () => {
        const dto = {
            company_id: '000',
            account_id: '1.1.10000',
            _condition: 'WHERE company_id = ${company_id} AND account_id = ${account_id};',
        }

        const expectedQuery = `DELETE FROM accounts WHERE company_id = '000' AND account_id = '1.1.10000';`;
        // Perform the action that triggers the database query
        const result = await model.delete(dto);

        // Verify the behavior and capture the value of actualQuery
        const actualQuery = pgpSpy.as.format.firstCall.returnValue;
        expect(actualQuery, expectedQuery);
    });

    it('should format the prepared statement correctly for CREATE TABLE', async () => {
        // const insertQuery = `INSERT INTO users (email, password, employee_id, full_name, role, created_by, last_modified_by) VALUES ($[email], $[password], $[employee_id], $[full_name], $[role], $[created_by], $[last_modified_by]);`
        const expectedQuery = `CREATE TABLE accounts ( company_id varchar(3), account_id varchar(20), name varchar(50) NOT NULL, description varchar(255), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(50) NOT NULL, updated_at timestamptz, updated_by varchar(50), PRIMARY KEY (company_id, account_id) );`;

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

        if (!match) console.log('CREATE TABLE statement not found.');

        const actualQuery = match[0];

        expect(actualQuery).to.equal(expectedQuery);

        const cwd = process.cwd();
        const delPath = path.join(cwd, 'db/sql');
        deleteDirectory(delPath);

        // Restore the original function
        writeCreateTableFileSpy.restore();
    });
});
