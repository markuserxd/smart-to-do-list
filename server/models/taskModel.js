const db = require("../database/database");

function getAllTasks(filters = {}) {
    const {
        search,
        status,
        priority,
        sort,
        page = 1,
        limit = 10
    } = filters;

    let whereClause = "WHERE 1 = 1";

    const params = [];

    if (search) {
        whereClause += `
            AND (
                title LIKE ?
                OR description LIKE ?
            )
        `;

        const searchTerm = `%${search}%`;

        params.push(searchTerm, searchTerm);
    }

    if (status === "completed") {
        whereClause += " AND completed = 1";
    }

    if (status === "pending") {
        whereClause += " AND completed = 0";
    }

    if (priority) {
        whereClause += " AND priority = ?";
        params.push(priority);
    }

    let orderClause;

    switch (sort) {
        case "oldest":
            orderClause = "ORDER BY created_at ASC, id ASC";
            break;

        case "deadline":
            orderClause = `
                ORDER BY
                    deadline IS NULL,
                    deadline ASC,
                    id ASC
            `;
            break;

        case "priority":
            orderClause = `
                ORDER BY CASE priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                    ELSE 4
                END,
                id ASC
            `;
            break;

        case "newest":
        default:
            orderClause = "ORDER BY created_at DESC, id DESC";
            break;
    }

    const offset = (page - 1) * limit;

    const tasksQuery = `
        SELECT *
        FROM tasks
        ${whereClause}
        ${orderClause}
        LIMIT ?
        OFFSET ?
    `;

    const tasks = db
        .prepare(tasksQuery)
        .all(...params, limit, offset);

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM tasks
        ${whereClause}
    `;

    const countResult = db
        .prepare(countQuery)
        .get(...params);

    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        tasks,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages
        }
    };
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