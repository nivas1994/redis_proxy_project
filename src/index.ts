import express, { raw } from 'express';
import { initializeClient } from './init';
import { LruCache } from './app/lruCache';


let cacheClient;
const app  = express();
let lruCache: LruCache;

app.listen(4000, () => {
    cacheClient = initializeClient(false);
    lruCache = new LruCache(20,100, cacheClient);
    console.log("server running on port 4000");
    
});

app.get('/', (req, res) => {
    console.log(lruCache);
    return res.send('Redis Proxy Project');  
});


app.get('/store/get/:key', async (req, res) => { 
    console.log("gettign values");
    const { key } = req.params;
    // const rawData = await lruCache.get(key);
    const rawData = await lruCache.get(key);
    return res.send(rawData);
});


