// server.js
// Server to test DAL built using pg-promise
'use strict';

const express = require('express');
//let pgp = require('pg-promise');
const config = require('config');
const DB = require('./db/db');
const Users = require('./Users');

const app = express();

// Insert middleware

// Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Callback to extend database with app specific repositories
const repos = (db, pgp) => {
    db.users = new Users(db, pgp);
};

const connection = config.get('connection');
const { db, pgp } = DB.init(connection, repos);

//Test the connection
db.connect()
    .then((obj) => {
        console.log('Connected to Postgres database!');
        obj.done(); // success, release connection;
    })
    .catch((error) => {
        console.log('Error connecting to Postgres database:', error.message);
    });

// Add test routes
app.get('/', (req, res) => {
    res.send('Welkom');
});

app.get('/log', (req, res) => {
    db.users.tableSQL();
    res.send('db.users.tableSQL');
});

app.get('/create', (req, res) => {
    db.users
        .createTable()
        .then(res.send('Created user table'))
        .catch((err) => res.send(err.message));
});

app.post('/insert', (req, res) => {
    const DTO = req.body;
    db.users
        .insert(DTO)
        .then(res.send('Row inserted'))
        .catch(err => res.send(err.message));
});

app.get('/find', (req, res) => {
    db.users
        .find()
        .then((data) => res.send(data))
        .catch((err) => res.send(err));
});

app.get('/find/:column/:value', (req, res) => {
    const column = req.params.column;
    const value = req.params.value;

    console.log('column ', column, 'value ', value);

    const pgp = db.users.pgp;
    if (
        typeof pgp === 'object' &&
        pgp !== null &&
        typeof pgp.connect === 'function'
    ) {
        console.log('pgp object is valid.');
    } else {
        console.log('pgp object is not valid.');
    }

    db.users
        .find(column, value)
        .then((data) => res.send(data))
        .catch((err) => res.send(err));
});

app.post('/update', (req, res) => {
    const DTO = req.body;
    db.users
        .update(DTO)
        .then(res.send('Record updated'))
        .catch(err => res.send(err.message));
});

// Start server
app.listen(3000, console.log('Server listening on at http://localhost:3000'));
