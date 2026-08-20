import jwt, { Secret } from "jsonwebtoken";

export const generateJWT = (body: any, expire: string | number = "1h"): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("Missing JWT_SECRET");

  // Make TS happy: jwt.Secret is the accepted secret type
  const secretTyped: Secret = jwtSecret as Secret;

  // jwt.sign is synchronous and returns a string
  const token = jwt.sign(body as object | string | Buffer, secretTyped, { expiresIn: expire });

  return token;
};
