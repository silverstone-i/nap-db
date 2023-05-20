// Users.js
// users tabel model

const Model = require('./db/Model');    

userSchema = {
    tableName: 'users',
    useCS: false,
    columns: [
        {
            name: 'email',
            type: 'varchar',
            length: 255,
            primary: true
        },
        {
            name: 'password',
            type: 'varchar',
            length: 50,
            notNull: true,
        },
        {
            name: 'employee_id',
            type: 'int4',
            notNull: true,
            unique: true,
        },
        {
            name: 'full_name',
            type: 'varchar',
            length: 50,
            notNull: true,
        },
        {
            name: 'role',
            type: 'varchar',
            length: 25,
            notNull: true,
        },
        {
            name: 'active',
            type: 'bool',
            notNull: true,
            default: true
        },
    ],
}





class Users extends Model {
    static #cs;

    // Deep copy userSchema to ensure it does not change
    constructor(db, pgp, schema = JSON.parse(JSON.stringify(userSchema))) { 
        super(db, pgp, schema);
        
        if(this.schema.useCS && !Users.#cs) Users.#cs = this.createColumnsets();
        if(this.schema.useCS) super.setColumnsets(Users.#cs);
    }

}

module.exports = Users;

