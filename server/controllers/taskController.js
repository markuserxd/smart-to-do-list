const taskModel = require("../models/taskModel");
const response = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

exports.getAllTasks = asyncHandler(async (req,res)=>{
    const tasks = taskModel.getAllTasks();

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
        task,
        "Task retrieved successfully"
    );

});