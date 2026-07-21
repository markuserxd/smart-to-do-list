const taskModel = require("../models/taskModel");
const response = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

exports.getAllTasks = asyncHandler(async (req,res)=>{
    const filters = {
        search: req.query.search?.trim(),
        status: req.query.status,
        priority: req.query.priority,
        sort: req.query.sort
    };

    const tasks = taskModel.getAllTasks(filters);

    return response.success(
        res,
        tasks,
        "Tasks retrieved successfully"
    );
});

exports.createTask = asyncHandler(async (req,res)=>{
    const { title, priority } = req.body;

    if (!title) {

        return response.error(
            res,
            "Title is required",
            400
        );

    }

    const priorities = ["Low", "Medium", "High"];

    if (priority && !priorities.includes(priority)) {
        return res.status(400).json({
            message: "Invalid priority"
        });
    }

    const task = taskModel.createTask(req.body);

    return response.success(
        res,
        task,
        "Task created successfully",
        201
    );
});

exports.getTaskById = asyncHandler(async (req,res)=>{

    const id = Number(req.params.id);

    const task = taskModel.getTaskById(id);

    if (!task) {

        return res.status(404).json({
            success: false,
            message: "Task not found"
        });

    }

    return response.success(
        res,
        req.task,
        "Task retrieved successfully"
    );

});

exports.updateTask = asyncHandler(async (req,res)=>{

    const id = Number(req.params.id);

    const task = taskModel.getTaskById(id);

    if (!task) {
        return response.error(
            res,
            "Task not found",
            404
        );
    }

    const { title, priority } = req.body;

    if (!title || title.trim() === "") {
        return response.error(
            res,
            "Title is required",
            400
        );
    }

    const priorities = ["Low", "Medium", "High"];

    if (priority && !priorities.includes(priority)) {
        return response.error(
            res,
            "Invalid priority",
            400
        );
    }

    const updatedTask = taskModel.updateTask(req.taskId, req.body);

    return response.success(
        res,
        updatedTask,
        "Task updated successfully"
    );
});

exports.toggleTaskComplete = asyncHandler(async (req,res)=>{
    const updatedTask = taskModel.toggleTaskComplete(
        req.taskId,
        req.task.completed
    );

    const message =
        updatedTask.completed === 1
            ? "Task marked as completed"
            : "Task marked as pending";

    return response.success(
        res,
        updatedTask,
        message
    );
});

exports.deleteTask = asyncHandler(async (req,res)=>{
    taskModel.deleteTask(req.taskId);

    return response.success(
        res,
        null,
        "Task deleted successfully"
    );
});