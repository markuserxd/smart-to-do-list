const db = require("../database/database");

function getAllTasks(filters = {}) {
    const {
        search,
        status,
        priority,
        sort
    } = filters;

    let query = `
        SELECT *
        FROM tasks
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {
        query += `
            AND (
                title LIKE ?
                OR description LIKE ?
            )
        `;

        const searchTerm = `%${search}%`;

        params.push(searchTerm, searchTerm);
    }

    if (status === "completed") {
        query += " AND completed = 1";
    }

    if (status === "pending") {
        query += " AND completed = 0";
    }

    if (priority) {
        query += " AND priority = ?";
        params.push(priority);
    }

    switch (sort) {
        case "oldest":
            query += " ORDER BY created_at ASC";
            break;

        case "deadline":
            query += `
                ORDER BY
                    deadline IS NULL,
                    deadline ASC
            `;
            break;

        case "priority":
            query += `
                ORDER BY CASE priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                    ELSE 4
                END
            `;
            break;

        case "newest":
        default:
            query += " ORDER BY created_at DESC";
            break;
    }

    return db.prepare(query).all(...params);
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

function deleteTask(id) {
    const stmt = db.prepare(`
        DELETE FROM tasks
        WHERE id = ?
    `);

    const result = stmt.run(id);

    return result.changes > 0;
}

module.exports = {
    getAllTasks,
    createTask,
    getTaskById,
    updateTask,
    toggleTaskComplete,
    deleteTask
};