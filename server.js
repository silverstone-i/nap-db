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

// repositories in the databa
const repositories = {
    users: Users,
}

const connection = config.get('connection');
const db = DB.init(connection, repositories);

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

app.get('/create', async (req, res) => {
    try {
        await db.users.createTable();
        res.status(201).send('Created user table');
    } catch (err) {
        res.status(409).send(err.message);
    }
});

app.post('/insert', async (req, res) => {
    const DTO = req.body;
    db.users
        .insert(DTO)
        .then(() => res.send('Row inserted'))
        .catch((err) => {
            res.status(500).send(err.message);
        });
});

app.get('/find', async (req, res) => {
    const dto = req.query.fields;

    try {
        const data = await db.users.findAll(dto);
        res.send(data);
    } catch (err) {
        console.log(err.message);
        res.status(500).send(err.message);
    }
});

app.get('/find/:column/:value', (req, res) => {
    const column = req.params.column;
    const value = req.params.value;
    const dto = req.query.fields;

    db.users
        .findWhere(dto, column, value)
        .then((data) => res.status(200).send(data))
        .catch((err) => res.status(404).send('Record not found'));
});

app.put('/update/', (req, res) => {
    const DTO = req.body;
    db.users
        .update(DTO)
        .then(() => res.send('Record updated'))
        .catch((err) => {
            return res.status(500).send(err.message);
        });
});

app.delete('/delete/:idValue', (req, res) => {
    const idValue = req.params.idValue;
    db.users
        .purge(idValue)
        .then(() => res.send('Record deleted'))
        .catch((err) => {
            return res.status(500).send(err.message);
        });
});

// Start server
app.listen(3000, () => console.log('Server listening at http://localhost:3000'));
