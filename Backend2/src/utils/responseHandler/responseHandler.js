const { httpStatus } = require("../constants/httpStatusCodes");

const responseHandler = (
  res,
  status,
  data,
  addOns,
) => {
  let resBody = {
    ...httpStatus[status],
    ...addOns,
  }
  if (data) resBody.data = data
  res.status(httpStatus[status].statusCode).send(resBody)
}

module.exports = { responseHandler };
