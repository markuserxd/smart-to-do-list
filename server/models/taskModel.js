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

    const stmt = db.prepare(`
        SELECT *
        FROM tasks
        WHERE id = ?
    `);

    return stmt.get(id);

}

function updateTask(id, task) {
    const stmt = db.prepare(`
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            priority = ?,
            deadline = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    const result = stmt.run(
        task.title,
        task.description,
        task.priority,
        task.deadline,
        id
    );

    if (result.changes === 0) {
        return null;
    }

    return getTaskById(id);
}

function toggleTaskComplete(id, currentCompleted) {
    const newCompleted = currentCompleted === 1 ? 0 : 1;

    const stmt = db.prepare(`
        UPDATE tasks
        SET
            completed = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(newCompleted, id);

    return getTaskById(id);
}

module.exports = {
    getAllTasks,
    createTask,
    getTaskById,
    updateTask,
    toggleTaskComplete
};