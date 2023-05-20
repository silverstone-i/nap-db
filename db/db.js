// db.js
// database class that holds the connection and pgp objects
'use strict';

class DB {
    static init(connection, repos) {
        const pgPromise = require("pg-promise");
        const { Diagnostics } = require("./diagnostics"); // optional diagnostics

        const initOptions = {
            capSQL: true, // capitalize all generated SQL
            // Extending the database protocol with our custom repositories;
            // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
            extend(obj, dc) {
                // Database Context (dc) is mainly useful when extending multiple databases with different access API-s.
                // Do not use 'require()' here, because this event occurs for every task and transaction being executed,
                // which should be as fast as possible.
                // for(const repository of Object.keys(repositories)) {
                //     obj.repository = new repositories[repository](obj, pgp);
                // }
                // Check if the pgp object is valid
                repos(obj, pgp); // Call back to repositories
            },
        }; 
        
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
