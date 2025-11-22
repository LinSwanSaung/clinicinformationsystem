/**
 * Response helper utilities
 * Standardizes API responses across the application
 */

/**
 * Success response
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response
 */
export const errorResponse = (
  res,
  message = 'Something went wrong',
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Paginated response
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < pagination.total,
      hasPrevPage: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};
