import { getFromServerCache, setToServerCache } from "./serverCache";
import { LocalCache } from "./localCache";
import { LruCacheInterface } from "./lruCacheInterface";


export class LruCache implements LruCacheInterface {

  private lruCacheMap: Map<string, CacheValue> = new Map<string, CacheValue>();
  private maxEntries: number = 0;
  private duration: number = 0;
  private cacheClient;
  private purgeFactor = 0.75;

  // private client: any; 

  public constructor(duration: number, maxEntries: number, cacheClient) {
    this.duration = duration;
    this.maxEntries = maxEntries;
    this.cacheClient = cacheClient;
  }

  // public getLocalCache() {
  //   let c = new LRUMap(3)
  //   c.set('adam',   29)
  //   c.set('john',   26)
  //   // c.set('angela', 24)
  //   // console.log(c);        // -> "adam:29 < john:26 < angela:24"
  //   // console.log(c.get('john'));
  // }

  public async get(key: string): Promise<string> {
    const hasKey = this.lruCacheMap.has(key);
    let entry: CacheValue;
    if (hasKey) {
      entry = this.lruCacheMap.get(key)!;
      if (!(this.checkIfEntryExpired(entry, Date.now()))) {
        this.lruCacheMap.delete(key);
        this.lruCacheMap.set(key, entry);
        return entry.value;

      } else {
        return await this.getFromServerCacheAndSetLocalCache(key) as string ;
      }
    } else {
      return await this.getFromServerCacheAndSetLocalCache(key) as string;
    }
  }

  public async put(key: string, value: string): Promise<string> {
    await setToServerCache(key, value, this.cacheClient);
    let entry = await getFromServerCache(key, this.cacheClient);
    return entry;
  }

  public async remove(key: string) {
    this.lruCacheMap.delete(key);
  }

  public hasKey(key: string): boolean {
    return this.lruCacheMap.has(key);
  }

  public printCache() {
    console.log(this.lruCacheMap);
  }

  private async getFromServerCacheAndSetLocalCache(key: string) {

    let purgeSize = this.maxEntries * this.purgeFactor;

    if (this.lruCacheMap.size > purgeSize) {
      this.lruCacheMap.delete(this.first(this.lruCacheMap));
    }
    let entry = await getFromServerCache(key, this.cacheClient)!;

    if (entry) {
      this.lruCacheMap.set(key, new CacheValue(key, entry, Date.now() + this.duration));
      return this.lruCacheMap.get(key)?.value;
    } else {
      return null;
    }
  }

  private checkIfEntryExpired(entry: CacheValue, date: number): boolean {
    return (entry.expiration > date);
  }

  private first(cache: Map<string, CacheValue>) {
    return cache.keys().next().value;
  }


}



export class CacheValue {

  key: string;
  value: string;
  expiration: number ;

  constructor(key: string , value: string, expiration: number) {
      this.key = key;
      this.value = value;
      this.expiration = expiration;
  }
}

