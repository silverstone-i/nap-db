// server.js
// Server to test DAL built using pg-promise
'use strict';

const express = require('express');
const config = require('config');
const DB = require('./db/db');

const app = express();

// Insert middleware

// Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Initialize the database
const initOptions = {
    capSQL: true, // capitalize all generated SQL
    // Extending the database protocol with our custom repositories;
    // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
    extend(obj, dc) {
        // Database Context (dc) is mainly useful when extending multiple databases with different access API-s.

        // Do not use 'require()' here, because this event occurs for every task and transaction being executed,
        // which should be as fast as possible.
    },
};

const connection = config.get("connection");
const {db, pgp} = DB.init(connection, initOptions);

//Test the connection
db.connect()
    .then((obj) => {
        console.log("Connected to Postgres database!");
        obj.done(); // success, release connection;
    })
    .catch((error) => {
        console.log("Error connecting to Postgres database:", error.message);
    });

// Add test routes
app.get('/', (req, res) => {
    res.send('Welkom')
})

// Start server
app.listen(3000, console.log('Server listening on at http://localhost:3000'));