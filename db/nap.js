// ./db/nap.js
//  Utility functions to support nap-db operations
'use strict';

const fs = require('fs');
const path = require('path');
const { QueryFile } = require('pg-promise');

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

class SqlFileWriter {
    constructor(schema) {
        if (!schema) throw new Error('Invalid schema');
        this.schema = schema;
    }

    writeCreateTableSQL(fileName) {
        const tableScript =
            `CREATE TABLE ${this.schema.tableName} (\n` +
            _buildTableColumns(this.schema.columns).slice(0, -2) +
            _buildForeignKeys(this.schema.foreignKeys).slice(0, -2) +
            '\n);';
        if (!fileName) fileName = 'create';

        return this.writeSqlFile(fileName, tableScript)
            .then( (path) => sqlQueryFile(path))
            .catch( (err) => Promise.reject(err));
    }

    writeSqlFile(fileName, sqlScript) {
        // Get module directory
        const baseDirectory = __dirname;
        const sqlDirectory = path.join(baseDirectory, 'sql');
        if (!fs.existsSync(sqlDirectory)) fs.mkdirSync(sqlDirectory);
        const repoDirectory = path.join(
            sqlDirectory,
            this.schema.tableName.toLowerCase()
        );
        if (!fs.existsSync(repoDirectory)) fs.mkdirSync(repoDirectory);

        // Write file
        const createPath = path.join(repoDirectory, `${fileName}.sql`);
        return new Promise((resolve, reject) => {
            fs.writeFile(createPath, sqlScript, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(createPath);
                }
            });
        });
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// pg-promise QueryFile to execute SQL file  scripts;
function sqlQueryFile(file) {
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

//////////////////////////////////////////////////////////////////////////////////////////
// Create columnsets to be used with a schema
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
    if (!schema.dbSchema) schema.dbSchema = 'public';
    const table = new pgp.helpers.TableName({
        table: `${schema.tableName}`,
        schema: `${schema.dbSchema}`,
    });

    const cs = {};
    cs[schema.tableName] = new pgp.helpers.ColumnSet(columns, { table: table });

    cs.insert = cs[schema.tableName].extend([`${timeStamps[1].name}`]);

    cs.update = cs[schema.tableName].extend([
        {
            name: `${timeStamps[2].name}`,
            mod: '^',
            def: 'CURRENT_TIMESTAMP',
        },
        `${timeStamps[3].name}`,
    ]);

    return cs;
}

module.exports = {
    SqlFileWriter,
    createColumnsets,
    sqlQueryFile,
    timeStamps,
};

/////////////////////////////////////////////////////////////////////////////////////
// Helpers to implement the utility functions

// Builde create table column string
function _buildTableColumns(columns) {
    return columns.reduce((str, column) => {
        str += column.name;
        str += ' ' + column.type;
        if (column.length) str += '(' + column.length + ')';
        if (column.unique) str += ' UNIQUE';
        if (column.notNull) str += ' NOT NULL';
        if (column.primary) str += ' PRIMARY KEY';
        if (column.default) str += ` DEFAULT ${column.default}`;
        str += ',\n';

        return str;
    }, '');
}

// Build create table foreign keys
function _buildForeignKeys(keys) {
    if (!keys) return '';

    return keys.reduce((str, key) => {
        str +=
            `FOREIGN KEY ${_buildForeignKeyColumns(key.hasRelations)}` +
            ` REFERENCES ${key.withTable}${_buildForeignKeyColumns(
                key.withColumns
            )}`;
        if (key.onDeleteAction) str += ` ON DELETE ${key.onDeleteAction}`;
        if (key.onUpdateAction) str += ` ON UPDATE ${key.onUpdateAction}`;
        str += `,\n`;

        return ',\n' + str;
    }, '');
}

// Build create table foreign key column relationship
function _buildForeignKeyColumns(columns) {
    return (
        columns
            .reduce((str, column) => {
                str += column.name + ', ';
                return str;
            }, '(')
            .slice(0, -2) + ')'
    );
}
