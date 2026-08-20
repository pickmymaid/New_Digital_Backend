export default {
  type: (fieldName:string,type: string) => `${fieldName} should be a ${type}` as string,
  min: (fieldName:string,length: number) => `${fieldName} should be at least ${length} character` as string,
  max: (fieldName:string,length: number) => `${fieldName} should be less that ${length} character` as string,
  required: (fieldName:string) => `${fieldName} is required` as string,
  match: (field1:string,field2:string) => `${field1} does not match ${field2}` as string,
  validity: (fieldName:string) => `Please enter a valid ${fieldName}`,
}