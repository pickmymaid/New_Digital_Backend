import jwt from 'jsonwebtoken'
import { token } from 'morgan'

export const decodeJWT = (token: string | undefined): any => {
    if(token){
        const decoded = jwt.decode(token);
        return decoded;
    }else{
        return false
    }
}