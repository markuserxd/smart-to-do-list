const taskModel = require("../models/taskModel");

exports.getAllTasks = (req, res) => {
    const tasks = taskModel.getAllTasks();

    res.json(tasks);
};

exports.createTask = (req, res) => {

    const { title, priority } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    const priorities = ["Low", "Medium", "High"];

    if (priority && !priorities.includes(priority)) {
        return res.status(400).json({
            message: "Invalid priority"
        });
    }

    const task = taskModel.createTask(req.body);

    res.status(201).json(task);
};