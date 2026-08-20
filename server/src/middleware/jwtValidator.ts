import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { responseHandler } from '../utils/responseHandler/responseHandler';


// Middleware function to validate JWT token
export const validateJwtToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming the token is sent in the Authorization header as Bearer token
  
  if (!token) {
    return responseHandler(res, 'UNAUTHORIZED')
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || ''; // Replace with your JWT secret
    await jwt.verify(token, jwtSecret) as JwtPayload;
    req.headers.authorization = token as string;
    next();
  } catch (error) {
    return responseHandler(res, 'UNAUTHORIZED')
  }
};