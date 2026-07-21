const express = require("express");
const router = express.Router();

const taskController = require("../controllers/taskController");
const validateTask = require("../middleware/validateTask");
const validateTaskId = require("../middleware/validateTaskId");
const validateTaskQuery = require("../middleware/validateTaskQuery");

router.get("/", validateTaskQuery, taskController.getAllTasks);
router.get("/:id", validateTaskId, taskController.getTaskById);
router.post("/", validateTask, taskController.createTask);
router.put("/:id", validateTaskId, validateTask, taskController.updateTask);
router.patch("/:id/complete",validateTaskId, taskController.toggleTaskComplete);
router.delete("/:id",validateTaskId,taskController.deleteTask);

module.exports = router;