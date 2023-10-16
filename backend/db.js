const mysql = require("mysql");

// Databse connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "signin",
});

module.exports = db;
