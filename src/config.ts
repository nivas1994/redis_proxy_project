interface IConfig {
    node_port: string;
    redis_host: string;
    redis_port: string;
    max_local_cache_size: string;
    global_expiration: string;
    limit_factor: string;
}

export const config: IConfig = {
    node_port: process.env.NODE_PORT || "4000",
    redis_host : process.env.REDIS_HOST || "redis",
    redis_port: process.env.REDIS_PORT || "6379",
    max_local_cache_size: process.env.MAX_LOCAL_CACHE_SIZE || "5",
    global_expiration: process.env.GLOBAL_EXPIRATION || "10000",  // 10000 milliseconds 
    limit_factor: process.env.LIMIT_FACTOR || "1" 
}