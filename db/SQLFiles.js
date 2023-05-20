// SQLFiles.js
// Helper class used to build SQL query files
/**
 *  The SQL file builder uses the following object definition to builde the queries
 *
 *    {
 *        tableName: 'tableName',
 *        dbSchema: 'schemaName',
 *        timeStamps: true,
 *        useCS: false,
 *        columns: [
 *            {
 *                name: 'fieldName',
 *                type: 'dataType',
 *                length: 255,
 *                unique: false,
 *                notNull: false,
 *                primary: false,
 *                default: 'value',
 *                useDefault: false,
 *            },
 *        ],
 *        foreignKeys: [
 *            {
 *                hasRelations: [{ name: 'field' }],
 *                withColumns: [{ name: 'withField' }],
 *                withTable: 'withTable',
 *                onDeleteAction: 'action',
 *                onUpdateAction: 'action'
 *            },
 *        ]
 *    };
 */
'use strict';

const fs = require('fs');
const path = require('path');

class SQLFiles {
    constructor(schema) {
        if (!schema) throw new Error('Invalid Schema Object');
        this.schema = schema;
    }

    writeSQLFiles(reWrite = false) {
        // Get module directory
        const baseDirectory = __dirname;
        const sqlDirectory = path.join(baseDirectory, 'sql');
        if (!fs.existsSync(sqlDirectory)) fs.mkdirSync(sqlDirectory);
        const repoDirectory = path.join(
            sqlDirectory,
            this.schema.tableName.toLowerCase()
        );
        if (!fs.existsSync(repoDirectory)) fs.mkdirSync(repoDirectory);

        const create = path.join(repoDirectory, 'create.sql');
        if (!fs.existsSync(create) || reWrite)
            fs.writeFileSync(create, this.tableSQL());

        if (!this.schema.useCS) {
            const insert = path.join(repoDirectory, 'insert.sql');
            if (!fs.existsSync(insert) || reWrite)
                fs.writeFileSync(insert, this.insertSQL());

            // const findAll = path.join(repoDirectory, 'findAll.sql');
            // if (!fs.existsSync(findAll) || reWrite)
            //     fs.writeFileSync(findAll, this.findSQLAll());

            // const findWhere = path.join(repoDirectory, 'findWhere.sql');
            // if (!fs.existsSync(findWhere) || reWrite)
            //     fs.writeFileSync(findWhere, this.findSQLWhere());

            const update = path.join(repoDirectory, 'update.sql');
            if (!fs.existsSync(update) || reWrite)
                fs.writeFileSync(update, this.updateSQL());

            const purge = path.join(repoDirectory, 'purge.sql');
            if (!fs.existsSync(purge) || reWrite)
                fs.writeFileSync(purge, this.purgeSQL());
        }
    }

    primaryKeyColumn() {
        return this.schema.columns.find((column) => column.primary).name;
    }

    // CREATE TABLE SQL
    tableSQL() {
        if (!this.schema) return;
        return (
            `CREATE TABLE ${this.schema.tableName} (\n` +
            this.#buildTableColumns(this.schema.columns).slice(0, -2) +
            this.#buildForeignKeys(this.schema.foreignKeys).slice(0, -2) +
            '\n);'
        );
    }

    insertSQL() {
        return (
            `INSERT INTO ${this.schema.tableName} (` +
            '${this:name}) VALUES (${this:csv});'
        );
    }

    findSQLAll() {
        return `SELECT $1:name FROM ${this.schema.tableName}`;
    }

    findSQLWhere() {
        return `SELECT $1:name FROM ${this.schema.tableName} WHERE $2:name = $3;`;
    }

    /////////////////////////////////////////////////////////////////////////////
    // pg-promise does not handle UPDATE SET SQL in a flexible way.  There are
    // two potential solutions
    //      1. Create the update queries dynamically using a DTO.
    //          app.put('/update/:key/:value', (req, res) => {
    //              const key = req.params.key;
    //              const value = req.params.value;
    //              const DTO = req.body
    //              ...... rest of code to update record
    //          })
    //
    //          SQL helper function would use DTO to create a list of
    //          column = updateValue, pairs to be updata in
    //          UPDATE table_name SET col1 = val1, col2 = val2, ... WHERE key = value
    //
    //      2. Use pg-promise built-in columnset helpers.  This is essentially the equivalent
    //         of 1 above. At this point it seems that column sets are the way to go.
    //         Should revisit SQL files when complex queries are required 

    updateSQL() {
        const set = this.schema.columns
            .reduce((str, column) => {
                if (
                    !(
                        column.type === 'serial' ||
                        column.primary ||
                        column.name === 'created_at' ||
                        column.name === 'created_by'
                    )
                ) {
                    str +=
                        `${column.name} = ` + '${' + `${column.name}` + '}, ';
                }
                return str;
            }, '')
            .slice(0, -2);

        const where = ` WHERE ${this.primaryKeyColumn()} = ` + '${email};';

        return `UPDATE ${this.schema.tableName} SET ` + set + where;
    }

    purgeSQL() {
        return `DELETE FROM ${
            this.schema.tableName
        } WHERE ${this.primaryKeyColumn()} = $1;`;
    }

    // Helper functions
    /*********************************************************************************************** */

    #buildTableColumns(columns) {
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

    #buildForeignKeys(keys) {
        if (!keys) return '';

        return keys.reduce((str, key) => {
            str +=
                `FOREIGN KEY ${this.#buildForeignKeyColumns(
                    key.hasRelations
                )}` +
                ` REFERENCES ${key.withTable}${this.#buildForeignKeyColumns(
                    key.withColumns
                )}`;
            if (key.onDeleteAction) str += ` ON DELETE ${key.onDeleteAction}`;
            if (key.onUpdateAction) str += ` ON UPDATE ${key.onUpdateAction}`;
            str += `,\n`;

            return ',\n' + str;
        }, '');
    }

    #buildForeignKeyColumns(columns) {
        return (
            columns
                .reduce((str, column) => {
                    str += column.name + ', ';
                    return str;
                }, '(')
                .slice(0, -2) + ')'
        );
    }
}

module.exports = SQLFiles;

// const sqlFiles = new SQLFiles();
// sqlFiles.writeSQLFiles();
