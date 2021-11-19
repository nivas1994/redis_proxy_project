
/**
 * @author: Nivas Narayanasamy
 * @desc: This file contains the calls to the backing redis instance
 */

import { LRUMapEntry } from "./localCache";

const util = require('util');

export async function getFromServerCache(  key: string, redisClient): Promise<string> {
    /**
     * @desc: This method gets the value for the key from the backing redis instance 
     */
    const getFromServerCache=  util.promisify(redisClient.get).bind(redisClient);
    return  getFromServerCache(key);
}


export async function setValuesToServerCache(mapValues: LRUMapEntry<String, String>[], redisClient) {
    /**
     * @desc: This method sets the value for the specifed key in the backing redis instance 
     */
    console.log(mapValues);
    for(let mapValue of mapValues) {
       await setToServerCache(mapValue.key, mapValue.value, redisClient);
    }
}

export async function setToServerCache(key: string, value: string, redisClient): Promise<string> {
    /**
     * @desc: This method sets the value for the specifed key in the backing redis instance 
     */
    const setToServerCachePromise = util.promisify(redisClient.set).bind(redisClient);
    return  setToServerCachePromise(key, value);
}

export async function pingServerCache(redisClient): Promise<string> {
    const pingServerCache = util.promisify(redisClient.ping).bind(redisClient);
    return  pingServerCache();
}

export async function deleteFromServerCache(key: string, redisClient): Promise<string> {
    const deleteEntryInServerCache = util.promisify(redisClient.delete).bind(redisClient);
    return  deleteEntryInServerCache(key);
}