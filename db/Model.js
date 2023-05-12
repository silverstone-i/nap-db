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
    insert(DTO) {

    }

    // Read recorde cRud
    find(field, value) {

    }

    // Update record crUd
    update(DTO, recordId) {

    }

    // Delete record cruD
    delete(recordID) {
        // TO DO: current implementation does not require a delete function
        // Deletes records set active field to false
        // delete functionality may be applied in the future
    }

    // Create table
    createTable() {

    }

    // This ia a private function called by the constructor 
    #init() {
        // Use this.schema to define the required sql tables
        this.insert = `INSERT INTO ${this.schema.tableName} (${this.#fieldList()}) VALUES (${this.#insertParams()});`;
        console.log(this.insert);
        this.update = `UPDATE ${this.schema.tableName} SET ${this.#updateParams()}`
        console.log(this.update);
        
        //console.log(result[0].name);
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
                console.log('Found primary key: ', field.name)
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

const model = new Model(null, null, schema2);