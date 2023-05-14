// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const SQLBuilder = require('./SQLBuilder');

class Model extends SQLBuilder{
    constructor(db, pgp, schema) {
        super(schema);
        this.db = db;
        this.pgp = pgp;

        this.insertQuery = this.insertSQL();
        this.findAllQuery = this.findSQL();
        this.findByFieldQuery = this.findSQL(false);
        this.updateQuery = this.updateSQL();
        this.deleteAllQuery = this.deleteSQL();
        this.deleteByPKQuery = this.deleteSQL(false);
    }

    // Create record Crud
    async insert(DTO) {
        const query = this.pgp.as.format(this.insertQuery, DTO);
        return await this.db.none(query, DTO);
    }

    // Read recorde cRud
    async find(column = null, value = null) {
        if (column === null || value == null) {
            const query = this.pgp.as.format(this.findAllQuery, null);
            return await this.db.any(query);
        } else {
            const query = this.pgp.as.format(this.findByFieldQuery, {
                column,
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
    async createTable() {
        const query = this.pgp.as.format(this.tableSQL(), null);
        console.log(query);
//        return await this.db.none(query);
    }
}

module.exports = Model;

