import express, { raw } from 'express';
import { initializeClient } from './init';
import { LocalCache } from 'app/localCache';


let cacheClient;
const app  = express();
let localCache: LocalCache;

app.listen(4000, () => {
    cacheClient = initializeClient(false);
    localCache = new LocalCache(20,100, cacheClient);
    console.log("server running on port 4000");
    
});

app.get('/', (req, res) => {
    return res.send('Redis Proxy Project');  
});


app.get('/get-value/:key', async (req, res) => { 
    console.log("gettign values");
    const { key } = req.params;
    const rawData = await localCache.get(key);
    return res.send(rawData);
});


