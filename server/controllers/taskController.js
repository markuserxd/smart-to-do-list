const taskModel = require("../models/taskModel");

exports.getAllTasks = (req, res) => {
    const tasks = taskModel.getAllTasks();

    res.json(tasks);
};

exports.createTask = (req, res) => {
    const task = taskModel.createTask(req.body);

    res.status(201).json(task);
};