const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error);
  });

// Define a schema for the user
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

// Create a model for the user collection
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));


// Signup page
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});


// Signup endpoint
app.post('/signup', async(req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Create a new user
  const newUser = new User({
    username: username,
    password: password
  });

  // Save the new user to the database

  //--->>old Method <<<<------
  // newUser.save((err) => {
  //   if (err) {
  //     console.log(err);
  //     res.sendStatus(500);
  //   } else {
  //     res.redirect('/signup-success'); // Redirect to a signup success page
  //   }
  // });

  try {
    // Save the new user to the database
    await newUser.save();
    res.redirect('/signup-success'); // Redirect to a signup success page
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }

});

app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});


// Login endpoint
app.post('/index', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Find the user with the provided username and password
  User.findOne({ username: username, password: password })
    .then((user) => {
      if (user) {
        res.redirect('/home'); // Redirect to the home page
      } else {
        res.redirect('/login-failure'); // Redirect to a login failure page
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});



// Signup success page
app.get('/signup-success', (req, res) => {
  res.send('Signup successful!');
});

// Home page
app.get('/home', (req, res) => {
  res.send('Welcome to the home page!');
});



// Login failure page
app.get('/login-failure', (req, res) => {
  res.send('Login failed. Please try again.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
