const { responseHandler } = require("../utils/responseHandler/responseHandler");

const validateUser = async (req, res, next) => {
    try{
        if(req?.user){
            next()
        }else{
            responseHandler(res, 'UNAUTHORIZED')
        }
    }catch (error) {
        console.log(error,'this is error');
        return responseHandler(res, 'UNAUTHORIZED')
    }
}

module.exports = { validateUser };
