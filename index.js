const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let users = [];  // In-memory user store
let exercises = [];  // In-memory exercise store

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST /api/users - to create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const id = new Date().getTime().toString(); // simple unique ID based on time

  const newUser = { username, _id: id };
  users.push(newUser);
  res.json(newUser);
});

// GET /api/users - to get the list of users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises - to add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).send('User not found');
  }

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const exercise = {
    description,
    duration,
    date: date.toDateString(), // Use toDateString to format the date
    userId
  };

  // Add the exercise to the user's exercise array (in the exercises array)
  exercises.push(exercise);

  // Return the user object with the exercise fields added
  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// GET /api/users/:_id/logs - to retrieve exercise logs
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).send('User not found');
  }

  const userExercises = exercises.filter(e => e.userId === userId);

  // Handle query parameters
  let { from, to, limit } = req.query;
  let log = userExercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date
  }));

  // Filter by date range if 'from' and 'to' are provided
  if (from) {
    const fromDate = new Date(from);
    log = log.filter(e => new Date(e.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(e => new Date(e.date) <= toDate);
  }

  // Limit the number of logs if 'limit' is provided
  if (limit) {
    const limitInt = parseInt(limit);
    log = log.slice(0, limitInt);
  }

  const count = log.length;
  res.json({ username: user.username, count, _id: user._id, log });
});

// Listening
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
