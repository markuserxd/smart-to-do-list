const db = require("../database/database");

function getAllTasks() {
    const stmt = db.prepare("SELECT * FROM tasks");
    return stmt.all();
}

function createTask(task) {
    const stmt = db.prepare(`
        INSERT INTO tasks
        (title, description, priority, deadline)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        task.title,
        task.description,
        task.priority,
        task.deadline
    );

    return db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);
}

function getTaskById(id) {

    return db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(id);

}

module.exports = {
    getAllTasks,
    createTask,
    getTaskById
};