import { config } from "./config";

const redis = require('redis');


export function initializeClient(forTest: boolean) {
    let redisClient;
    if (forTest) {
         redisClient = redis.createClient({
            port: parseInt(config.redis_port)
        });
    } else {
         redisClient = redis.createClient({ host: config.redis_host,
        port: parseInt(config.redis_port) });
    }

    return redisClient;
}