// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const { join } = require('path');
const { QueryFile } = require('pg-promise');
const SQLFiles = require('./SQLFiles');

const timeStamps = [
    {
        name: 'created_at',
        type: 'timestamptz',
        default: 'CURRENT_TIMESTAMP',
        useDefault: true,
        notNull: true,
    },
    {
        name: 'created_by',
        type: 'varchar',
        length: 50,
        notNull: true,
    },
    {
        name: 'updated_at',
        type: 'timestamptz',
    },
    {
        name: 'updated_by',
        type: 'varchar',
        length: 50,
    },
];

class Model {
    static #sql;
    constructor(db, pgp, schema) {
        this.schema = schema;
        this.originalSchema = JSON.parse(JSON.stringify(schema));
        if (schema.timeStamps === undefined || schema.timeStamps)
            this.schema.columns = [...schema.columns, ...timeStamps];
        this.db = db;
        this.pgp = pgp;
        this._selectAll = `SELECT $1:name FROM ${this.schema.tableName}`
        this._selectWhere = `SELECT $1:name FROM ${this.schema.tableName} WHERE $2:name = $3;`
        this._updateCondition = `WHERE ${this.primaryKeyColumn()} = ` + '${' + `${this.primaryKeyColumn()}` + '};';

        new SQLFiles(this.schema).writeSQLFiles();

        if (!Model.#sql) {
            const sqlPath = join(__dirname, `sql/${this.schema.tableName}`);
            Model.#sql = pgp.utils.enumSql(
                sqlPath,
                { recursive: true },
                (file, fileName, path) => {
                    return sql(file);
                }
            );
        }
    }

    get selectAll () {
        return this._selectAll;
    }

    set selectAll(query) {
        this._selectAll = query;
    }

    get selectWhere () {
        return this._selectWhere;
    }

    set selectWhere(query) {
        this._selectWhere = query;
    }

    get updateCondition () {
        return this._selectWhere;
    }

    set updateCondition(query) {
        this._selectWhere = query;
    }

    primaryKeyColumn() {
        return this.schema.columns.find((column) => column.primary).name;
    }

    // Create record Crud
    insert(dto) {
        let query = '';
        if (this.schema.useCS) {
            query = this.pgp.helpers.insert(dto, this.cs.insert);
        } else {
            query = this.pgp.as.format(Model.#sql.insert, dto);
        }

        return this.db.none(query).catch((err) => Promise.reject(err));
    }

    // Read recorde cRud
    findAll(dto) {
        const query = this.pgp.as.format(this._selectAll, [dto]);
        console.log(query);

        return this.db
            .any(query)
            .catch((err) => Promise.reject(err));
    }

    // cRud - Locate a specific record returning selected fields
    findWhere(dto, column, value) {
        const query = this.pgp.as.format(this._selectWhere, [dto, column, value]);

        return this.db
            .oneOrNone(query)
            .catch((err) => Promise.reject(err));
    }

    // Update record crUd
    update(dto) {
        let query = '';
        if (this.schema.useCS) {
            const condition = this.pgp.as.format(this._updateCondition, dto);
            query = this.pgp.helpers.update(dto, this.cs.update) + condition;
        } else {
            query = this.pgp.as.format(Model.#sql.update, dto);
        }

        console.log(query);

        return this.db
            .result(query)
            .then((result) => {
                if (result.rowCount === 0) {
                    // No rows were updated, handle the case where the record does not exist
                    throw new Error('User does not exist');
                }
            })
            .catch((err) => Promise.reject(err));
    }

    // Delete record cruD
    purge(idValue) {
        return this.db
            .none(Model.#sql.purge, idValue)
            .catch((err) => Promise.reject(err));
    }

    // Create table
    createTable() {
        return this.db
            .none(Model.#sql.create)
            .catch((err) => Promise.reject(err));
    }

    createColumnsets() {
        return createColumnsets(this.pgp, this.originalSchema);
    }

    setColumnsets(cs) {
        this.cs = cs;
    }
}

///////////////////////////////////////////////
// Helper for linking to external query files;
function sql(file) {
    const options = {
        // minifying the SQL is always advised;
        // see also option 'compress' in the API;
        minify: true,

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
    const columns = JSON.parse(
        schema.columns
            .reduce((str, column) => {
                if (column.primary)
                    return (str += `{ "name": "${column.name}", "cnd": true}, `);
                return (str += `{ "name": "${column.name}", "skip": "function" }, `);
            }, '[')
            .slice(0, -2) + ']'
    );

    columns.forEach((element) => {
        if (element.skip) element.skip = (c) => !c.exists;
    });

    // create all ColumnSet objects only once:
    // Type TableName is useful when schema isn't default "public" ,
    // otherwise you can just pass in a string for the table name.
    if(!schema.dbSchema) schema.dbSchema = 'public';
    const table = new pgp.helpers.TableName({
        table: `${schema.tableName}`,
        schema: `${schema.dbSchema}`,
    });

    const cs = {};
    const csTable = `cs.${schema.tableName}`;
    console.log(csTable);
    cs[schema.tableName] = new pgp.helpers.ColumnSet(columns, { table: table });

    cs.insert = cs.users.extend([`${timeStamps[1].name}`]);

    cs.update = cs.users.extend([
        {
            name: `${timeStamps[2].name}`,
            mod: '^',
            def: 'CURRENT_TIMESTAMP',
        },
        `${timeStamps[3].name}`,
    ]);

    return cs;
}

module.exports = Model;
