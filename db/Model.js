// Model.js
// Base class for implementing CRUD interface to database
'use strict';

const { SqlFileWriter, createColumnsets, timeStamps } = require('./nap');



class Model {
    static #sql;
    constructor(db, pgp, schema) {
        this.schema = schema;
        this.originalSchema = JSON.parse(JSON.stringify(schema));
        if (schema.timeStamps === undefined || schema.timeStamps)
            this.schema.columns = [...schema.columns, ...timeStamps];
        this.db = db;
        this.pgp = pgp;
        this._selectAll = `SELECT $1:name FROM ${this.schema.tableName}`;
        this._selectWhere = `SELECT $1:name FROM ${this.schema.tableName} WHERE $2:name = $3;`;
        this._updateCondition =
            `WHERE ${this.primaryKeyColumn()} = ` +
            '${' +
            `${this.primaryKeyColumn()}` +
            '};';
    }

    get selectAll() {
        return this._selectAll;
    }

    set selectAll(query) {
        this._selectAll = query;
    }

    get selectWhere() {
        return this._selectWhere;
    }

    set selectWhere(query) {
        this._selectWhere = query;
    }

    get updateCondition() {
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
        const query = this.pgp.helpers.insert(dto, this.cs.insert);
        return this.db.none(query).catch((err) => Promise.reject(err));
    }

    // Read recorde cRud
    findAll(dto) {
        const query = this.pgp.as.format(this._selectAll, [dto]);

        return this.db.any(query).catch((err) => Promise.reject(err));
    }

    // cRud - Locate a specific record returning selected fields
    findWhere(dto, column, value) {
        const query = this.pgp.as.format(this._selectWhere, [
            dto,
            column,
            value,
        ]);

        return this.db.oneOrNone(query).catch((err) => Promise.reject(err));
    }

    // Update record crUd
    update(dto) {
        const condition = this.pgp.as.format(this._updateCondition, dto);
        const query = this.pgp.helpers.update(dto, this.cs.update) + condition;
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
        return this.writeCreateTableFile()
            .then((qf) => {
                return this.db.none(qf);
            })
            .catch((err) => Promise.reject(err));
    }

    writeCreateTableFile() {
        const writer = new SqlFileWriter(this.schema);
        return writer
            .writeCreateTableSQL()
            .then((qf) => qf)
            .catch((err) => Promise.reject(err));
    }

    createColumnsets() {
        return createColumnsets(this.pgp, this.originalSchema);
    }

    setColumnsets(cs) {
        this.cs = cs;
    }
}

module.exports = Model;
