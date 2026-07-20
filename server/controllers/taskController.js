const taskModel = require("../models/taskModel");

exports.getAllTasks = (req, res) => {
    const tasks = taskModel.getAllTasks();

    res.json(tasks);
};