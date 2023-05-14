// SQLBuilder.js
// Helper class used to build SQL queries
/**
 *  The SQL builder uses files specified with the following object definition
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

class SQLBuilder {
    constructor(schema) {
        this.schema = schema;
    }

    primaryKeyField() {
        return this.schema.columns.find((column) => column.primary).name;
    }

    // CREATE TABLE SQL
    tableSQL() {
        if (!this.schema) return;
        //if (this.tableSQL) return this.tableSQL;

        let query = `CREATE TABLE ${this.schema.tableName} (\n`;

        query += this.#buildTableColumns(this.schema.columns);
        query += this.#buildForeignKeys(this.schema.foreignKeys);
        query = query.slice(0, -2) + '\n);';

        return query;
    }

    insertSQL() {
        return `INSERT INTO ${this.schema.tableName} (${this.#insertColumns(this.schema.columns)}) VALUES (${this.#insertColumnValues(this.schema.columns)});`;
    }

    findSQL(findAll = true) {
        if(findAll) return `SELECT * FROM ${this.schema.tableName};`;
        return `SELECT * FROM ${this.schema.tableName} WHERE $[column] = '$[value]';`;
    }

    updateSQL() {
        return `UPDATE ${this.schema.tableName} SET ${this.#updateParams(this.schema.columns)}`;
    }

    deleteSQL(deleteAll = true) {
        if(deleteAll) return `DELETE * FROM ${this.schema.tableName};`;
        return `DELETE * FROM ${this.schema.tableName} WHERE ${this.primaryKeyField()} = '$[value]';`;
    }

    // Helper functions
    /*********************************************************************************************** */

    // Build collumns list for the INSERT query
    #insertColumns(columns) {
        return columns
            .reduce((str, column) => {
                if (!(column.type === 'serial' || column.useDefault)) {
                    str += column.name + ', '; // Concatenate field.name to the accumulated string
                }
                return str; // Return the updated accumulated string
            }, '')
            .slice(0, -2);
    }

    // Build the named params for the INSERT query
    #insertColumnValues(columns) {
        return columns
            .reduce((str, column) => {
                if (!(column.type === 'serial' || column.useDefault)) {
                    str += '${' + column.name + '}, '; // Concatenate field.name to the accumulated string
                }
                return str; // Return the updated accumulated string
            }, '')
            .slice(0, -2);
    }

    // Build the UPDATE query
    #updateParams(columns) {
        let primary = '';
        let query = columns
            .reduce((str, column) => {
                if (column.primary) {
                    primary = column.name;
                }

                if (
                    !(
                        column.type === 'serial' ||
                        column.useDefault ||
                        column.name === 'created_by'
                    )
                ) {
                    str += column.name + ' = ${' + column.name + '}, ';
                }

                return str;
            }, '')
            .slice(0, -2);

        query += ` WHERE ${primary} = ` + '${' + primary + '};';
        return query;
    }

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
                `FOREIGN KEY ${this.#buildForeignKeyColumns(key.hasRelations)}` +
                ` REFERENCES ${key.withTable}${this.#buildForeignKeyColumns(key.withColumns)}`;
            if(key.onDeleteAction) str += ` ON DELETE ${key.onDeleteAction}`;
            if (key.onUpdateAction) str += ` ON UPDATE ${key.onUpdateAction}`;
            str += `,\n`;

            return str;
        }, '');
    }

    #buildForeignKeyColumns(columns) {
        return (
            columns
                .reduce((str, column) => {
                    str += column.name + ', ';
                    return str;
                }, '(').slice(0, -2) + ')');
    }
}

module.exports = SQLBuilder;

