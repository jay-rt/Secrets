require("dotenv").config();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

//Defining a schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//Secret key for encryption
userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

//Exporting the model
module.exports = mongoose.model("User", userSchema);
