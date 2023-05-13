// Model.js
// Base class for implementing CRUD interface to database
'use strict';
const pgp = require('pg-promise')();

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
            useDefault: false
        },
    ],
    foreignKey:{
        table: 'referenceTable',
        refernceField: [
            {field: 'referenceField'}
        ],
        tableField: [
            {field: 'field'}
        ]
    }
}

class Model {
    constructor(db, pgp, schema) {
        this.db = db;
        this.pgp = pgp;
        this.schema = schema;

        this.#init()
    }

    // Create record Crud
    async insert(DTO) {
        const query = this.pgp.as.format(this.insertQuery, DTO);
        return await this.db.none(query, DTO);
    }

    // Read recorde cRud
    async find(field = null, value = null) {
        if (field === null || value == null) {
            const findQuery = `SELECT * FROM ${this.schema.tableName};`;
            const query = this.pgp.as.format(findQuery, null);
            return await this.db.any(query);
        } else {
            const findQuery = `SELECT * FROM ${this.schema.tableName} WHERE ${field} = '${value}';`;
            const query = this.pgp.as.format(findQuery, {field: field, value: value});
           return await this.db.oneOrNone(query);
        }
    }

    // Update record crUd
    async update(DTO) {
        const query = this.pgp.as.format(this.updateQuery, DTO);
        return await this.db.none(query, DTO);
    }

    // Delete record cruD
    delete(field = null, value = null) {
        let query = '';
        if (field === null || value == null) {
            query = `DELETE * FROM ${this.schema.tableName};`;
        } else {
            query = `DELETE * FROM ${this.schema.tableName} WHERE ${field} = '${value}';`;
        }
    }

    // Create table
    createTable() {

    }

    // This ia a private function called by the constructor 
    #init() {
        // Use this.schema to define the required sql tables
        this.insertQuery = `INSERT INTO ${this.schema.tableName} (${this.#fieldList()}) VALUES (${this.#insertParams()});`;
        this.updateQuery = `UPDATE ${this.schema.tableName} SET ${this.#updateParams()}`
    }

    // Build fields list for the INSERT query
    #fieldList() {
        return this.schema.fields.reduce((str, field) => {
            if (!(field.type === 'serial' || field.useDefault)) {
                str += field.name + ', '; // Concatenate field.name to the accumulated string
            }
            return str;  // Return the updated accumulated string
        }, '').slice(0, -2);
    }

    // Build the named params for the INSERT query
    #insertParams() {
        return this.schema.fields.reduce((str, field) => {
            if (!(field.type === 'serial' || field.useDefault)) {
                str += '${' + field.name + '}, '; // Concatenate field.name to the accumulated string
            }
            return str;  // Return the updated accumulated string
        }, '').slice(0, -2);
    }

    // Build the UPDATE query
    #updateParams() {
        let primary = '';
        let query = this.schema.fields.reduce((str, field) => {
            if(field.primary) {
                primary = field.name;
            }

            if (!(field.type === 'serial' || field.useDefault || field.name === 'created_by')) {
                    str += field.name + ' = ${' + field.name + '}, ';
            }

            return str;
            
        }, '').slice(0, -2);

        query += ` WHERE ${primary} = ` + '${' + primary + '};';
        return query;
    }
}

const schema2 = {
    tableName: 'users',
    fields: [
        {
            name: 'id',
            type: 'serial',
            primary: true
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
            useDefault: true
        },
        {
            name: 'created_by',
        },
        {
            name: 'last_modified',
            useDefault: true
        },
        {
            name: 'last_modified_by',
        },
    ]
}

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

module.exports = Model;

// const model = new Model(null, pgp, schema2);
// model.find('id', 1);
