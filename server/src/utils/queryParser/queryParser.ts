export const queryParser = (query:string | null, doesSplit?: boolean | string) => {
    if(query){
        return doesSplit ? decodeURIComponent(query as string).split(typeof doesSplit === 'string' ? doesSplit : ',') : decodeURIComponent(query as string)
    }else{
        return null
    }
}