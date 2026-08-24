const { getPaginatedMaids } = require("../../queries/v2/maids.queries")
const { maidFilterGenerator } = require("../../utils/maidFilterGenerator/maidFilterGenerator");

const getPaginatedMaidsService = (page, filter, sort, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const { filter: pipeline, primaryService } = maidFilterGenerator(filter);
            const data = await getPaginatedMaids(page, pipeline, sort, user_id, primaryService);
            resolve(data)
        }catch(error){
            console.log(error);
            reject(error.message)
        }
    })
}

module.exports = { getPaginatedMaidsService };
