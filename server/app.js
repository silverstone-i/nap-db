const express = require('express');
const bodyParser = require('body-parser');
const DB = require('../db/DB');
const Users = require('./Users');

('use strict');
require('dotenv').config();
const app = express();

// Initialize the database
const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

const repositories = { users: Users };

const db = DB.init(connection, repositories);

// Test connection
// db.connect()
//   .then((obj) => {
//     console.log('Connected to Postgres database!');
//     obj.done(); // success, release connection;
//   })
//   .catch((err) => {
//     console.error(err);
//   });

try {
  db.users.init();
  console.log('Table created');
} catch (error) {
  console.error('Error creating table:', error.message);
}

// Add middleware to parse incoming requests as JSON
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add a route to create a new user
app.post('/insert', async (req, res) => {
  console.log('Hello');

  try {
    const DTO = req.body;
    await db.users.insert(DTO);
    console.log('User created:');
    res.json('user created');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/select', async (req, res) => {
  try {
    const DTO = req.body;
    console.log('DTO:', DTO);

    const result = await db.users.select(DTO);

    // console.log('Result:', result);

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/update', async (req, res) => {
  try {
    const DTO = req.body;
    await db.users.update(DTO);
    console.log('User updated:');
    
    res.json('user updated');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/delete', async (req, res) => {
  try {
    const DTO = req.body;
    await db.users.delete(DTO);
    res.json('user deleted');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/count', async (req, res) => {
  try {
    const dto = req.body;
    const count = await db.users.count(dto);
    res.json(count);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
