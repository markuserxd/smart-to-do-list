const response = require("../utils/response");

function validateTaskQuery(req, res, next) {
    const {
        status,
        priority,
        sort,
        page,
        limit
    } = req.query;

    const allowedStatuses = ["completed", "pending"];
    const allowedPriorities = ["Low", "Medium", "High"];
    const allowedSorts = [
        "newest",
        "oldest",
        "deadline",
        "priority"
    ];

    if (status && !allowedStatuses.includes(status)) {
        return response.error(
            res,
            "Status must be completed or pending",
            400
        );
    }

    if (priority && !allowedPriorities.includes(priority)) {
        return response.error(
            res,
            "Priority must be Low, Medium, or High",
            400
        );
    }

    if (sort && !allowedSorts.includes(sort)) {
        return response.error(
            res,
            "Sort must be newest, oldest, deadline, or priority",
            400
        );
    }

    if (
        page !== undefined &&
        (!Number.isInteger(Number(page)) || Number(page) <= 0)
    ) {
        return response.error(
            res,
            "Page must be a positive integer",
            400
        );
    }

    if (
        limit !== undefined &&
        (
            !Number.isInteger(Number(limit)) ||
            Number(limit) < 1 ||
            Number(limit) > 100
        )
    ) {
        return response.error(
            res,
            "Limit must be an integer between 1 and 100",
            400
        );
    }

    next();
}

module.exports = validateTaskQuery;