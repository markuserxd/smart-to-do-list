const db = require("../database/database");

function getAllTasks() {
    const stmt = db.prepare("SELECT * FROM tasks");
    return stmt.all();
}

module.exports = {
    getAllTasks
};