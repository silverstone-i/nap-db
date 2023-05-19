// Users.js
// users tabel model

const Model = require('./db/Model');    

userSchema = {
    tableName: 'users',
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
        // {
        //     name: 'created_at',
        //     type: 'timestamptz',
        //     default: 'CURRENT_TIMESTAMP',
        //     useDefault: true,
        // },
        // {
        //     name: 'created_by',
        //     type: 'varchar',
        //     length: 25,
        //     notNull: true,
        // },
        // {
        //     name: 'last_modified_at',
        //     type: 'timestamptz',
        // },
        // {
        //     name: 'last_modified_by',
        //     type: 'varchar',
        //     length: 25,
        // },
    ],
}





class Users extends Model {
    constructor(db, pgp, schema = userSchema) {
        super(db, pgp, schema);
    }

    logQueries() {
        console.log('CREATE TABLE\n', this.tableSQL);
    }

}

module.exports = Users;

