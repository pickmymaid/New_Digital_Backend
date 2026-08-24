const bcrypt = require('bcrypt');

const passwordToHash = async (password) => {
  return await bcrypt.hash(password, 10);
}

module.exports = { passwordToHash };
