const Database = require("better-sqlite3");

const db = new Database("./database/todo.db");

module.exports = db;