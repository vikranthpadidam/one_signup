const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const ejs =require('ejs');
const port = process.env.port || 3000;
// const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');
const saltRounds = 10;
require("dotenv").config();

const app = express();


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
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
  email:String,
  username: String,
  password: String,
  secret:String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//This is for encryption
// var secret = process.env.YOO;
// userSchema.plugin(encrypt, { secret: secret ,encryptedFields:["password"]});

// Create a model for the user collection
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});


//o-autho2.0
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECAT,
  callbackURL: "http://localhost:3000/auth/google/secat",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


// Signup page(in case of seperate html page)
// app.get('/signup', (req, res) => {
//   res.sendFile(__dirname + '/signup.html');
// });
app.get("/signup",function(req,res){
  res.render("signup");
});


app.get("/",function(req,res){
  res.render("login");
});

app.get("/home",function(req,res){
  if(req.isAuthenticated()){
    res.render("home");
  }else{
    res.redirect("/");
  }
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secat",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/home");
  });

//imported signup->register
//This came form passportLocalMongoose(both register and login)
  app.post("/signup", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        res.redirect("Username already exists");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/home");
        });
      }
    });
  
  });


// Signup endpoint(initial code)//////////////////////////////////////
// app.post('/signup', async(req, res) => {

//   bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
//     // Store hash in your password DB.
//   // Create a new user
//   const newUser = new User({
//     username: req.body.username,
//     password: hash
//   });
//   try {
//     // Save the new user to the database
//     await newUser.save();
//     res.redirect('/signup-success'); // Redirect to a signup success page
//   } catch (error) {
//     console.log(error);
//     res.sendStatus(500);
//   }

// });

// });

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.redirect("/username doesn't exsist")
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

// Login endpoint(initial code)//////////////////////////////
// app.post('/login', (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;

//   // Find the user with the provided username and password
//   User.findOne({ username: username})
//     .then((user) => {
//       if (user) {
//         if(user){
//           bcrypt.compare(password, user.password, function(err, result) {
//             if(result===true){
//               res.redirect('/home');
//             }
//             else{
//               res.redirect('/Password not Match');
//             }
//         });
//         }
//       }
//       else {
//         res.redirect('/login-failure'); // Redirect to a login failure page
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//       res.sendStatus(500);
//     });
// });

//logout
app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Signup success page
app.get('/signup-success', (req, res) => {
  res.send('Signup successful!');
});

// Home page
// app.get('/home', (req, res) => {
//   res.send('Welcome to the home page!');
// });


// Login failure page
app.get('/login-failure', (req, res) => {
  res.send('User not found signin to Login.Try again');
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
