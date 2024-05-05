'use strict';

const Model = require('../db/Model');

class Users extends Model {
    constructor(db, pgp) {
        super(db, pgp, {
            tableName: 'users',
            columns: {
                id: { type: 'serial', primaryKey: true },
                username : {type:'varchar(255)', nullable:false},
                password :{type:'varchar(255)',nullable:false},
                email: { type: 'varchar(255)', nullable: false },
                age: { type: 'integer', nullable:true, default: 18 },
            }
        });
    }
}

module.exports = Users;