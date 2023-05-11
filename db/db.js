// db.js
// database class that holds the connection and pgp objects
'use strict';

class DB {
    static init(connection, initOptions) {
        const pgPromise = require("pg-promise");
        const { Diagnostics } = require("./diagnostics"); // optional diagnostics
                // Initializing the library:
        const pgp = pgPromise(initOptions);

        // Creating the database instance:
        const db = pgp(connection);

        // Initializing optional diagnostics:
        Diagnostics.init(initOptions);

        return { db, pgp};
    }
}

module.exports = DB;
