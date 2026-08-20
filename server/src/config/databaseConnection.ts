import mongoose from 'mongoose';

/**
 * This function connects to a MongoDB database using the URI provided in the environment variables and
 * logs a message if the connection is successful.
 */
export const connectDatabase = async () => {
  const uri: string = process.env.MONGODB_URI || "";

  await mongoose.connect(uri).then(() =>
    console.log('Database Connected successfully!'
    ))
}
