// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const schema1 = {
    tableName: 'tableName',
    fields: [
        {
            name: 'fieldName',
            type: 'dataType',
            length: 255,
            unique: false,
            notNull: false,
            primary: false,
            default: 'value',
            useDefault: false,
        },
    ],
    foreignKey: {
        table: 'referenceTable',
        refernceField: [{ field: 'referenceField' }],
        tableField: [{ field: 'field' }],
    },
};

class Model {
    constructor(db, pgp, schema) {
        this.db = db;
        this.pgp = pgp;
        this.schema = schema;

        this.#init();
    }

    primaryKeyField() {
        return this.schema.fields.find((field) => field.primary).name;
    }

    // Create record Crud
    async insert(DTO) {
        const query = this.pgp.as.format(this.insertQuery, DTO);
        return await this.db.none(query, DTO);
    }

    // Read recorde cRud
    async find(field = null, value = null) {
        if (field === null || value == null) {
            const query = this.pgp.as.format(this.findAllQuery, null);
            return await this.db.any(query);
        } else {
            const query = this.pgp.as.format(this.findByFieldQuery, {
                field,
                value,
            });
            return await this.db.oneOrNone(query);
        }
    }

    // Update record crUd
    async update(DTO) {
        const query = this.pgp.as.format(this.updateQuery, DTO);
        return await this.db.none(query, DTO);
    }

    // Delete record cruD
    async delete(value = null) {
        if (value == null) {
            const query = this.pgp.as.format(this.deleteAllQuery, null);
            return await this.db.none(query);
        } else {
            const query = this.pgp.as.format(this.deleteByPKQuery, {
                value,
            });
            return await this.db.none(query);
        }
    }

    // Create table
    createTable() {}

    // This ia a private function called by the constructor
    #init() {
        // Use this.schema to define the required sql tables
        this.insertQuery = `INSERT INTO ${
            this.schema.tableName
        } (${this.#insertFields()}) VALUES (${this.#insertValues()});`;
        this.updateQuery = `UPDATE ${
            this.schema.tableName
        } SET ${this.#updateParams()}`;
        this.findAllQuery = `SELECT * FROM ${this.schema.tableName};`;
        this.findByFieldQuery = `SELECT * FROM ${this.schema.tableName} WHERE $[field] = '$[value]';`;
        this.deleteAllQuery = `DELETE * FROM ${this.schema.tableName};`;
        this.deleteByPKQuery = `DELETE * FROM ${
            this.schema.tableName
        } WHERE ${this.primaryKeyField()} = '$[value]';`;
    }

    // Build fields list for the INSERT query
    #insertFields() {
        return this.schema.fields
            .reduce((str, field) => {
                if (!(field.type === 'serial' || field.useDefault)) {
                    str += field.name + ', '; // Concatenate field.name to the accumulated string
                }
                return str; // Return the updated accumulated string
            }, '')
            .slice(0, -2);
    }

    // Build the named params for the INSERT query
    #insertValues() {
        return this.schema.fields
            .reduce((str, field) => {
                if (!(field.type === 'serial' || field.useDefault)) {
                    str += '${' + field.name + '}, '; // Concatenate field.name to the accumulated string
                }
                return str; // Return the updated accumulated string
            }, '')
            .slice(0, -2);
    }

    // Build the UPDATE query
    #updateParams() {
        let primary = '';
        let query = this.schema.fields
            .reduce((str, field) => {
                if (field.primary) {
                    primary = field.name;
                }

                if (
                    !(
                        field.type === 'serial' ||
                        field.useDefault ||
                        field.name === 'created_by'
                    )
                ) {
                    str += field.name + ' = ${' + field.name + '}, ';
                }

                return str;
            }, '')
            .slice(0, -2);

        query += ` WHERE ${primary} = ` + '${' + primary + '};';
        return query;
    }
}

module.exports = Model;

