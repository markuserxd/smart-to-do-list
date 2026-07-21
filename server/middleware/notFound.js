const response = require("../utils/response");

function notFound(req, res) {
    return response.error(
        res,
        `Route ${req.method} ${req.originalUrl} not found`,
        404
    );
}

module.exports = notFound;