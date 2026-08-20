export const httpStatus = {
  OK: {
    status: 'OK',
    statusCode: 200,
    message: 'Fetched successfully'
  },
  CREATED: {
    status: 'Created',
    statusCode: 201,
    message: 'Created successfully'
  },
  NO_CONTENT: {
    status: 'No Content',
    statusCode: 204,
    message: 'No data available'
  },
  BAD_REQUEST: {
    status: 'Bad request',
    statusCode: 400,
    message: 'Bad request!'
  },
  UNAUTHORIZED: {
    status: 'Unauthorized',
    statusCode: 401,
    message: 'Unauthorized user!'
  },
  NOT_FOUND: {
    status: 'Not Found',
    statusCode: 404,
    message: 'Resource not founded!'
  },
  INTERNAL_SERVER_ERROR: {
    status: 'Internal Server Error',
    statusCode: 500,
    message: 'Internal server error!'
  }
  
}