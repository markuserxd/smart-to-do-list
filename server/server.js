require("dotenv").config();

const app = require("./app");
const db = require("./database/database");

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

let isShuttingDown = false;

function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down...`);

    // better-sqlite3 ปิดแบบ synchronous
    try {
        if (db.open) {
            db.close();
            console.log("Database connection closed.");
        } else {
            console.log("Database was already closed.");
        }
    } catch (error) {
        console.error("Error closing database:", error);
    }

    server.close((error) => {
        if (error) {
            console.error("Error closing HTTP server:", error);
            process.exitCode = 1;
            return;
        }

        console.log("HTTP server closed.");
        process.exitCode = 0;
    });

    if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
    }

    setTimeout(() => {
        console.error("Forced shutdown.");
        process.exit(1);
    }, 5000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));