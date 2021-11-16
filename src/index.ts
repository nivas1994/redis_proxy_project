import express, { raw } from 'express';
import { initializeClient } from './init';
import { LocalCache } from './app/localCache';
import { getFromServerCache } from './app/serverCache';


const app  = express();
let localCache: LocalCache; 
let cacheClient;

app.listen(4000, () => {
    cacheClient = initializeClient(false);
    localCache = new LocalCache(20,100, cacheClient);
    console.log("server running on port 4000");
    
});
 
app.get('/', (req, res) => {
    return res.send('Redis Proxy Project');  
});

// Hits the local cache 
app.get('/get-value/:key', async (req, res) => { 
    console.log("gettign values");
    const { key } = req.params;
    const rawData = await localCache.get(key);
    return res.send(rawData);
});

// Directly calls the backing redis instance to get the value for the key
app.get('/get-value-from-server-cache/:key', async (req, res) => { 
    console.log("gettign values");
    const { key } = req.params;
    const rawData = await getFromServerCache(key, cacheClient);
    return res.send(rawData);
});


