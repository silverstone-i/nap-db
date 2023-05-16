// SQLFiles.js
// Helper class used to build SQL query files
/**
 *  The SQL file builder uses the following object definition to builde the queries
 *
 *    {
 *        tableName: 'tableName',
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

    writeSQLFiles() {
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
        fs.writeFileSync(create, this.tableSQL());

        const insert = path.join(repoDirectory, 'insert.sql');
        fs.writeFileSync(insert, this.insertSQL());

        const findAll = path.join(repoDirectory, 'findAll.sql');
        fs.writeFileSync(findAll, this.findSQLAll());

        const findWhere = path.join(repoDirectory, 'findWhere.sql');
        fs.writeFileSync(findWhere, this.findSQLWhere());

        const update = path.join(repoDirectory, 'update.sql');
        fs.writeFileSync(update, this.updateSQL());
    }

    primaryKeyField() {
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
        return `SELECT * FROM ${this.schema.tableName}`;
    }

    findSQLWhere() {
        return `SELECT $1:name FROM ${this.schema.tableName} WHERE $2:name = $3:value;`;
    }

    updateSQL() {
        return (
            `UPDATE ${this.schema.tableName} SET ` +
            '${this:name} = ${this:value} WHERE $2:name = $3:value'
        );
    }

    deleteSQL(deleteAll = true) {
        if (deleteAll) return `DELETE * FROM ${this.schema.tableName};`;
        return `DELETE * FROM ${
            this.schema.tableName
        } WHERE ${this.primaryKeyField()} = '$[value]';`;
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
