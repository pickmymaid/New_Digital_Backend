

export const generateUniqueId = (): string => {
    const timestamp: string = Date.now().toString(36); // Convert timestamp to base36 string
    const randomChars: string = Math.random().toString(36).substring(2, 8); // Generate random string
  
    return `${timestamp}-${randomChars}`;
  };
  