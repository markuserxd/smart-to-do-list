const taskModel = require("../models/taskModel");
const response = require("../utils/response");

function validateTaskId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return response.error(res, "Invalid task ID", 400);
    }

    const task = taskModel.getTaskById(id);

    if (!task) {
        return response.error(res, "Task not found", 404);
    }

    req.task = task;
    req.taskId = id;

    next();
}

module.exports = validateTaskId;