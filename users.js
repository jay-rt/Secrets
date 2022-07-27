const mongoose = require("mongoose");

//Defining a schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//Exporting the model
module.exports = mongoose.model("User", userSchema);
