const queryParser = (query, doesSplit) => {
    if(query){
        return doesSplit ? decodeURIComponent(query).split(typeof doesSplit === 'string' ? doesSplit : ',') : decodeURIComponent(query)
    }else{
        return null
    }
}

module.exports = { queryParser };
