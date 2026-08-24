const yupErrorMessageFormatter = (error) => {
  return {
    message: error.message,
    errorKey: error?.path
  }
}

module.exports = { yupErrorMessageFormatter };
