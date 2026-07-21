const path = require("path");
const Database = require("better-sqlite3");

const defaultPath = path.join(
    __dirname,
    "todo.db"
);

const databasePath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : defaultPath;

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

module.exports = db;