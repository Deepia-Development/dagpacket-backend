const mongoose = require("mongoose");
require("dotenv").config();
const initializeDatabase = require('./utils/initialaziServices.js');

async function run() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
   // initializeDatabase();
    console.log("Successfully connected!");      
  } catch (err) {
    console.error("Can't connect to database:", err);
  }
}

module.exports = { run };