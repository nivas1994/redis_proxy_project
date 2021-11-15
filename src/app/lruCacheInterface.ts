export interface LruCacheInterface {
    
    get(key: string): Promise<string> ; 
    
    put(key: string, value: string): Promise<string>;

    hasKey(key: string): boolean;
    
    printCache();
}