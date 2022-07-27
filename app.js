//Requiring the necessary modules
const express = require("express");
const mongoose = require("mongoose");
const User = require("./users");
const md5 = require("md5");

//Creating a new instance of express
const app = express();

//Setting the view engine as ejs
app.set("view engine", "ejs");

//Serving up the static files
app.use(express.static("public"));

//Extracting the values from form
app.use(express.urlencoded({ extended: true }));

//Connecting to mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

//GET Request
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

//POST Request
app.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password),
    });
    await newUser.save();
    res.render("secrets");
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.username });
    if (user && user.password === md5(req.body.password)) {
      res.render("secrets");
    } else {
      console.log("Invalid email or password");
    }
  } catch (err) {
    console.log(err);
  }
});

//Listening on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
