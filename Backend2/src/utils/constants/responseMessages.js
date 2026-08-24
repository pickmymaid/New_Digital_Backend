module.exports = {
  type: (fieldName,type) => `${fieldName} should be a ${type}`,
  min: (fieldName,length) => `${fieldName} should be at least ${length} character`,
  max: (fieldName,length) => `${fieldName} should be less that ${length} character`,
  required: (fieldName) => `${fieldName} is required`,
  match: (field1,field2) => `${field1} does not match ${field2}`,
  validity: (fieldName) => `Please enter a valid ${fieldName}`,
}
