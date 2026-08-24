const jwt = require("jsonwebtoken");

const generateJWT = (body, expire = "1h") => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("Missing JWT_SECRET");

  // jwt.sign is synchronous and returns a string
  const token = jwt.sign(body, jwtSecret, { expiresIn: expire });

  return token;
};

module.exports = { generateJWT };
