const { responseHandler } = require("../utils/responseHandler/responseHandler");
const jwt = require('jsonwebtoken');

const roleValidator = (roles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization || '';

    const jwtSecret = process.env.JWT_SECRET || ''; // Replace with your JWT secret
    let decoded = await jwt.verify(token, jwtSecret);

    if (roles.includes(decoded.role)) {
      req.user = decoded;
      next();
    } else {
      return responseHandler(res, 'UNAUTHORIZED')
    }
  } catch (error) {
    return responseHandler(res, 'UNAUTHORIZED')
  }
}

module.exports = { roleValidator };
