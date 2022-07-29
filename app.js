//Requiring the necessary modules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./users");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const methodOverride = require("method-override");

//Creating a new instance of express
const app = express();

//Setting the view engine as ejs
app.set("view engine", "ejs");

//Serving up the static files
app.use(express.static("public"));

//Extracting the values from form
app.use(express.urlencoded({ extended: true }));

//Enabling flash middleware which allows us to display flash message
app.use(flash());

//Initializing the session middleware with given options
app.use(
  session({
    //secret use to sign the session ID
    secret: process.env.SECRET,
    //don't save if the session is never modified during the request
    resave: false,
    //don't save new but not modified session
    saveUninitialized: false,
  })
);

//Initialize passport on every route call
app.use(passport.initialize());

//allow passport to use express-session
app.use(passport.session());

//Connecting to mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

//Generating salt using bcryptjs
const salt = bcrypt.genSaltSync(10);

//Authorize user function
const authorizeUser = async (username, password, done) => {
  try {
    const user = await User.findOne({ email: username });
    if (!user) {
      return done(null, false, { message: "No user found with that email" });
    } else if (bcrypt.compareSync(password, user.password)) {
      return done(null, user);
    } else if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false, { message: "Invalid password" });
    }
  } catch (err) {
    console.log(err);
    return done(err);
  }
};

passport.use(new LocalStrategy(authorizeUser));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

//check if the user is authenticated
const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

//check if the user in not authenticated
const checkNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/secrets");
  }
  next();
};

// override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

//GET Request
app.get("/", checkNotAuthenticated, (req, res) => {
  res.render("home");
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login", { messages: req.flash("error") });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register", { messages: req.flash("info") });
});

app.get("/secrets", checkAuthenticated, (req, res) => {
  res.render("secrets");
});

//POST Request
app.post("/register", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.username });
    if (user) {
      req.flash("info", "User already exists with that email");
      res.redirect("/register");
    } else {
      const newUser = new User({
        email: req.body.username,
        password: await bcrypt.hash(req.body.password, salt),
      });
      await newUser.save();
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.render("secrets");
  }
);

//DELETE Request
app.delete("/logout", (req, res) => {
  req.logOut((err) => console.log(err));
  res.redirect("/");
});

//Listening on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
