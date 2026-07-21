const db = require("../database/database");

beforeAll(() => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT NOT NULL DEFAULT 'Medium'
                CHECK(priority IN ('Low', 'Medium', 'High')),
            deadline TEXT,
            completed INTEGER NOT NULL DEFAULT 0
                CHECK(completed IN (0, 1)),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
});

beforeEach(() => {
    db.prepare("DELETE FROM tasks").run();

    db.prepare(`
        DELETE FROM sqlite_sequence
        WHERE name = 'tasks'
    `).run();
});

afterAll(() => {
    if (db.open) {
        db.close();
    }
});