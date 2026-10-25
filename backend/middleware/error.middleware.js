const errorMiddleware = (err, req, res, next) => {
    void next;
    console.error(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'CastError') {
        statusCode = 404;
        message = `Resource not found. Invalid: ${err.path}`;
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = 'A record with that value already exists';
    }

    if (err.code === 'P2002') {
        statusCode = 409;
        message = 'A record with that value already exists';
    }

    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Resource not found';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((value) => value.message).join(', ');
    }

    res.status(statusCode).json({ success: false, message });
}

export default errorMiddleware;