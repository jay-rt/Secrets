const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

//Defining a schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//Plugin Passport Local Mongoose
userSchema.plugin(passportLocalMongoose);

//Exporting the model
module.exports = mongoose.model("User", userSchema);
