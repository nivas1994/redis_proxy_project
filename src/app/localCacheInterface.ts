export interface LocalCacheInterface {
    
    get(key: string): Promise<string> ; 
    
    put(key: string, value: string): Promise<string>;

    hasKey(key: string): boolean;

    getLatestKey(): string;

    getOldestKey(): string;
    
    printCache();
}