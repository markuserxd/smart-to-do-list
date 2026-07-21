const response = require("../utils/response");

function validateTask(req, res, next) {
    const { title, priority, deadline } = req.body;

    if (typeof title !== "string" || title.trim() === "") {
        return response.error(res, "Title is required", 400);
    }

    if (title.trim().length > 100) {
        return response.error(
            res,
            "Title must not exceed 100 characters",
            400
        );
    }

    const allowedPriorities = ["Low", "Medium", "High"];

    if (priority && !allowedPriorities.includes(priority)) {
        return response.error(
            res,
            "Priority must be Low, Medium, or High",
            400
        );
    }

    if (deadline) {
        const deadlineDate = new Date(deadline);

        if (Number.isNaN(deadlineDate.getTime())) {
            return response.error(
                res,
                "Deadline must be a valid date",
                400
            );
        }
    }

    // ป้องกัน title ที่มีช่องว่างด้านหน้าและด้านหลัง
    req.body.title = title.trim();

    next();
}

module.exports = validateTask;