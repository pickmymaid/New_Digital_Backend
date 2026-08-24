const bcrypt = require('bcrypt');

const passwordValidator = async (givenPassword, dbPassword) => {
  return await bcrypt.compare(givenPassword, dbPassword);
}

module.exports = { passwordValidator };
