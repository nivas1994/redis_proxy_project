import express, { raw } from 'express';
import { initializeClient } from './init';
import { LocalCache, LRUMapEntry } from './app/localCache';
import { getFromServerCache, pingServerCache, setToServerCache } from './app/serverCache';
import { config } from './config';
import { plainToClass } from 'class-transformer';


const app  = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let localCache: LocalCache; 
let cacheClient;

const PORT =  config.node_port;

app.listen(PORT, () => {
    cacheClient = initializeClient(false);
    localCache = new LocalCache(parseInt(config.max_local_cache_size),parseInt(config.global_expiration), cacheClient, parseInt(config.limit_factor));
    console.log(`server running on ${PORT} `);
    
});
 
app.get('/', (req, res) => {
    return res.send('Redis Proxy Project');  
});


// Directly calls the backing redis instance to check if it is running
app.get('/ping-local', async (req, res) => { 
    res.status(200);
    res.send("PONG");
});

// Directly calls the backing redis instance to check if it is running
app.get('/ping-server-cache', async (req, res) => { 
    const rawData = await pingServerCache (cacheClient);
    console.log("rawdate: " + rawData);
    if (rawData == 'PONG') {
        res.status(200);
        res.send(rawData);
    } else {
        res.status(404);
        res.send("Not alive");
    }
});


// Hits the local cache 
app.get('/get-value/:key', async (req, res) => { 
    const { key } = req.params;
    const rawData = await localCache.get(key);
    return res.send(rawData);
});

// Check if the key exists in the local cache
app.get('/has-key/:key', async (req, res) => { 
    const { key } = req.params;
    const rawData = await localCache.hasKey(key);
    return res.send(rawData);
});

// Directly calls the backing redis instance to get the value for the key
app.get('/get-value-from-server-cache/:key', async (req, res) => { 
    const { key } = req.params;
    const rawData = await getFromServerCache(key, cacheClient);
    return res.send(rawData);
});


// Directly calls the backing redis instance to set the value for the json object
app.post('/put-value-to-server-cache', async (req, res) => { 
    let entry = plainToClass(LRUMapEntry, req.body as LRUMapEntry<string, string>);
    const rawData = await setToServerCache(entry.key, entry.value, cacheClient);
    return res.send(rawData);
}); 

// Directly calls the backing redis instance to set a array of key-value pair
app.post('/put-values-to-server-cache', async (req, res) => { 
    console.log(req);
    let values = plainToClass(LRUMapEntry, req.body);
    console.log(values);
    const rawData = await setToServerCache(values.key, values.value, cacheClient);
    return res.send(rawData);
}); 

// Get the current stat of the cache
app.get('/get-oldest', async (req, res) => { 
    const rawData =  localCache.getOldestKey();
    return res.send(rawData);
});

// Get the current stat of the cache
app.get('/get-stats', async (req, res) => { 
    const rawData =  localCache.getStats();
    return res.send(rawData);
});

