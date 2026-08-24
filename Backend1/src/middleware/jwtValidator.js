const jwt = require('jsonwebtoken');
const { responseHandler } = require('../utils/responseHandler/responseHandler');


// Middleware function to validate JWT token
const validateJwtToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming the token is sent in the Authorization header as Bearer token

  if (!token) {
    return responseHandler(res, 'UNAUTHORIZED')
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || ''; // Replace with your JWT secret
    await jwt.verify(token, jwtSecret);
    req.headers.authorization = token;
    next();
  } catch (error) {
    return responseHandler(res, 'UNAUTHORIZED')
  }
};

module.exports = { validateJwtToken };
