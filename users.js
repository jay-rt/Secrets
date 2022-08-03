const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

//Defining a schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

//Plugin Passport Local Mongoose and findOrCreate
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Exporting the model
module.exports = mongoose.model("User", userSchema);
