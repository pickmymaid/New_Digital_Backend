export const yupErrorMessageFormatter = (error:any) => {
  return {
    message: error.message,
    errorKey: error?.path
  }
}