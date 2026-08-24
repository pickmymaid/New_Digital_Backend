const jwt = require('jsonwebtoken');

const validateJwtToken = (token) => {
  return new Promise((resolve, reject) => {
    let jwtSecret = process.env.JWT_SECRET || '';
    if (token) {
      jwt.verify(token, jwtSecret, (err, decoded) => {
          return resolve(decoded || {});
      });
    } else {
      reject({ message: 'No token found' })
    }
  });
}

module.exports = { validateJwtToken };
