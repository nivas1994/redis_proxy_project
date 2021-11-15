
const util = require('util');

export async function getFromServerCache(  key: string, redisClient): Promise<string> {
    const getFromServerCache=  util.promisify(redisClient.get).bind(redisClient);
    return  getFromServerCache(key);
}

export async function setToServerCache(key: string, value: string, redisClient): Promise<string> {
    const setToServerCache = util.promisify(redisClient.set).bind(redisClient);
    return  setToServerCache(key, value);
}

export async function deleteFromServerCache(key: string, redisClient): Promise<string> {
    const deleteEntryInServerCache = util.promisify(redisClient.delete).bind(redisClient);
    return  deleteEntryInServerCache(key);
}