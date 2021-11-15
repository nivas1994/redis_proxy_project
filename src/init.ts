
const redis = require('redis');


export function initializeClient(forTest: boolean) {
    let redisClient;
    if ( forTest) {
         redisClient = redis.createClient({
            port: 6379
        });
    } else {
         redisClient = redis.createClient({ host: 'redis',
        port: 6379 });
    }

    return redisClient;
}