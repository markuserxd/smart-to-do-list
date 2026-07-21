function errorHandler(err, req, res, next) {
    console.error(err);

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body"
        });
    }

    const statusCode =
        err.statusCode ||
        err.status ||
        500;

    const message =
        statusCode === 500
            ? "Internal Server Error"
            : err.message;

    return res.status(statusCode).json({
        success: false,
        message
    });
}

module.exports = errorHandler;