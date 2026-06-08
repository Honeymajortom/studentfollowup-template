// utils/response.js
// Consistent API response envelope used by every controller

function success(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    status:  "success",
    message,
    data,
  });
}

function created(res, data = {}, message = "Created successfully") {
  return success(res, data, message, 201);
}

function paginated(res, rows, total, page, limit, message = "Success") {
  return res.status(200).json({
    status:  "success",
    message,
    data: {
      rows,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNext:    page * limit < total,
        hasPrev:    page > 1,
      },
    },
  });
}

function error(res, message = "Internal Server Error", statusCode = 500, details = null) {
  const body = { status: "error", message };
  if (details && process.env.NODE_ENV === "development") body.details = details;
  return res.status(statusCode).json(body);
}

function notFound(res, message = "Resource not found") {
  return error(res, message, 404);
}

function badRequest(res, message = "Bad request", details = null) {
  return error(res, message, 400, details);
}

function unauthorized(res, message = "Unauthorized") {
  return error(res, message, 401);
}

function forbidden(res, message = "Forbidden") {
  return error(res, message, 403);
}

module.exports = { success, created, paginated, error, notFound, badRequest, unauthorized, forbidden };
