const path = require("path");

process.env.NODE_ENV = "test";

process.env.DATABASE_PATH = path.join(
    __dirname,
    "..",
    "database",
    "test.db"
);