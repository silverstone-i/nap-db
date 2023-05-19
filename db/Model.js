// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const {join} = require('path');
const {QueryFile} = require('pg-promise');
const SQLFiles = require('./SQLFiles');

class Model {
    static #sql;
    constructor(db, pgp, schema) {
        this.schema = schema;
        this.db = db;
        this.pgp = pgp;
        
        new SQLFiles(this.schema).writeSQLFiles();

        if(!Model.#sql) {
            const sqlPath = join(__dirname, `sql/${this.schema.tableName}`);
            Model.#sql = pgp.utils.enumSql(sqlPath, { recursive: true }, (file, fileName, path) => {
                return sql(file);
            });
        }
    }

    // Create record Crud
    insert(DTO) {
        return this.db.none(Model.#sql.insert, DTO).catch( (err) => Promise.reject(err));
    }

    // Read recorde cRud
    findAll() {
        return this.db.any(Model.#sql.findAll).catch( err => Promise.reject(err));
    }

    // cRud - Locate a specific record returning selected fields
    findWhere(DTO, column, param) {
        return this.db.oneOrNone(Model.#sql.findWhere, [DTO, column, param]).catch( err => Promise.reject(err));
    }
    

    // Update record crUd
    update(DTO) {
        return this.db.result(Model.#sql.update, DTO)
            .then( (result) => {
                if (result.rowCount === 0) {
                    // No rows were updated, handle the case where the record does not exist
                    throw new Error('User does not exist');
                  }
            })
            .catch ( err => Promise.reject(err));
    }

    // Delete record cruD
    purge(idValue) {
        return this.db.none(Model.#sql.purge, idValue)
            .catch ( err => Promise.reject(err));
    }

    // Create table
    async createTable() {
        return await this.db.none(Model.#sql.create)
            .catch ( err => Promise.reject(err));
    }
}

///////////////////////////////////////////////
// Helper for linking to external query files;
function sql(file) {

    const options = {

        // minifying the SQL is always advised;
        // see also option 'compress' in the API;
//        minify: true

        // See also property 'params' for two-step template formatting
    };

    const qf = new QueryFile(file, options);

    if (qf.error) {
        // Something is wrong with our query file :(
        // Testing all files through queries can be cumbersome,
        // so we also report it here, while loading the module:
        console.error(qf.error);
    }
    return qf;
}
/////////////////////////////////////////////
// Helper to create columnsets
function createColumnsets(pgp, schema) {
    // Create the columnset data array
    const columns = JSON.parse(schema.columns.reduce( (str, column) => {
        if(column.primary) return str += `{ "name": "${column.name}", "cnd": true}, `;
        return str += `{ "name": "${column.name}", "skip": "function" }, `
    }, '[').slice(0, -2) + ']');

    columns.forEach(element => {
        if(element.skip) element.skip = (c) => !c.exists;
    });

    // create all ColumnSet objects only once:
    // Type TableName is useful when schema isn't default "public" ,
    // otherwise you can just pass in a string for the table name.
    const table = new pgp.helpers.TableName({
        table: `${schema.tableName}`,
        schema: `${schema.dbSchema}`,
    });

    const cs = {};
    const csTable = `cs.${schema.tableName}`;
    console.log(csTable);
    cs[schema.tableName] = new pgp.helpers.ColumnSet(columns, {table: table} );

    cs.insert = cs.users.extend(['created_by']);

    cs.update = cs.users.extend([
        {
            name: 'last_modified_at',
            mod: '^',
            def: 'CURRENT_TIMESTAMP',
        },
        'last_modified_by',
    ]);

    return cs;
}



module.exports = Model;
