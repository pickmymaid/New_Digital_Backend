const mongoose = require('mongoose');

/**
 * This function connects to a MongoDB database using the URI provided in the environment variables and
 * logs a message if the connection is successful.
 */
const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || "";

  await mongoose.connect(uri).then(() =>
    console.log('Database Connected successfully!'
    ))
}

module.exports = { connectDatabase };
