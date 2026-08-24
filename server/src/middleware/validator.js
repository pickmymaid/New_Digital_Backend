const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { yupErrorMessageFormatter } = require("../utils/yupErrorMessageFormatter/yupErrorMessageFormatter");

const validator = (schema) => async (req, res, next) => {
  try {
    let body = req.body
    await schema.validate(body);
    next()
  } catch (error) {
    responseHandler(res, 'BAD_REQUEST', null, {
      ...yupErrorMessageFormatter(error)
    })
  }
}

module.exports = { validator };
