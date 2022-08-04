//Requiring the necessary modules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./users");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

//Setting up passport-local Local Stragtegy with correct options
passport.use(User.createStrategy());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

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

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to secret pages.
    res.redirect("/secrets");
  }
);

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login", { messages: req.flash("error") });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register", { messages: req.flash("info") });
});

app.get("/secrets", checkAuthenticated, async (req, res) => {
  try {
    const users = await User.find({ secret: { $ne: null } });
    res.render("secrets", { usersWithSecret: users });
  } catch (err) {
    console.log(err);
  }
});

app.get("/submit", checkAuthenticated, (req, res) => {
  res.render("submit");
});

//POST Request
app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        req.flash("info", err.message);
        res.redirect("/register");
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/submit", checkAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    console.log(user);
    user.secret = req.body.secret;
    await user.save();
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

//DELETE Request
app.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
});

//Listening on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
