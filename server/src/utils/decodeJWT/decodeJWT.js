const jwt = require('jsonwebtoken');

const decodeJWT = (token) => {
    if(token){
        const decoded = jwt.decode(token);
        return decoded;
    }else{
        return false
    }
}

module.exports = { decodeJWT };
