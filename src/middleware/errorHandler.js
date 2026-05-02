export function notFoundHandler(_req, res) {
    return res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, _req, res, _next) {
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    return res.status(statusCode).json({
        message: error.message || "Internal server error."
    });
}
