

const generateUniqueId = () => {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
    const randomChars = Math.random().toString(36).substring(2, 8); // Generate random string

    return `${timestamp}-${randomChars}`;
  };

module.exports = { generateUniqueId };
