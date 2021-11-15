import { LocalCacheInterface } from "./localCacheInterface";
import { getFromServerCache, setToServerCache } from "./serverCache";

  const RIGHT = Symbol('right');
  const LEFT = Symbol('left');
  
  export class LocalCache implements LocalCacheInterface {

    private size: number;  // Current size of the cache 
    private expirationTime: number = 0; // Global Expiration time
    private limit: number; // Max limit of the cache
    private oldest: any; // Oldest entry in the list
    private latest: any; // Latest entry in the list
    private serverCacheClient: any; // Server Cache Instance
    private cacheHit: number = 0; // Number of hits that matches a key in the cache, if a entry is expired , it is not added to cache hit
    private cacheMiss: number = 0; // Number of misses in the cache, if a key not in both local cache and server cache is sent, that doesnt contribute to miss
    private fillFactor: number = 1; // Fill factor specifies the max size of the cache map after purging.
    private keyMap: Map<any, any>; // Hashmap to hold the key , value pair

    constructor(limit, expirationTime, serverCacheClient, fillFactor) {
      validateInputs()
      this.size = 0;
      this.limit = limit;
      this.expirationTime = expirationTime;
      this.oldest = this.latest = undefined;
      this.serverCacheClient = serverCacheClient;
      this.fillFactor = fillFactor;
      this.keyMap = new Map();
    }
  
    public async get(key) {
      let value = this.keyMap.get(key);
      if (!value) {
        await this.getFromServerCacheAndSetLocalCache(key);
        if (this.keyMap.has(key)) {
          this.cacheMiss++;
          return this.keyMap.get(key).value;
        } else {
          return null;
        }

      } else {
   
        if (!this.checkIfEntryExpired(value, Date.now())) {
            console.log("INSIDE local cache");
            this.updateLatestAndOldest(value);
            this.cacheHit++;
            return value.value;
        } else {
          this.cacheMiss++;
          await this.getFromServerCacheAndSetLocalCache(key);
          if (this.keyMap.has(key)) {
            return this.keyMap.get(key).value;
          }
        }
      }
    }

    public async put(key: string, value: string): Promise<string> {
      await setToServerCache(key, value, this.serverCacheClient);
      let entry = await getFromServerCache(key, this.serverCacheClient);
      return entry;
    }

    public hasKey(key: string): boolean {
      return this.keyMap.has(key);
    } 
    public printCache() {
      console.log(this.keyMap);
    }

    public getLatest(): string {
      if (this.latest) {
        return this.latest.value;
      } else {
        return "";
      }
    }

    public getOldest(): string {
      if (this.oldest) {
        return this.oldest.value;
      } else {
        return "";
      }
    }

    public getStats() {
      let stats = {
        'size': this.size,
        'cacheHit': this.cacheHit,
        'cacheMiss': this.cacheMiss,
        'purgeFacor': this.fillFactor,
        'limit': this.limit,
        'expirationTime': this.expirationTime
      };
      return stats;
    }

    private updateLatestAndOldest(entry) {
      if (entry === this.latest) {
        // Already the most recenlty used entry, so no need to update the list
        return;
      }
      // HEAD--------------TAIL
      //   <.older   .newer>
      //  <--- add direction --
      //   A  B  C  <D>  E
      if (entry[RIGHT]) {
        if (entry === this.oldest) {
          this.oldest = entry[RIGHT];
        }
        entry[RIGHT][LEFT] = entry[LEFT]; // C <-- E.
      }
      if (entry[LEFT]) {
        entry[LEFT][RIGHT] = entry[RIGHT]; // C. --> E
      }
      entry[RIGHT] = undefined; // D --x
      entry[LEFT] = this.latest; // D. --> E
      if (this.latest) {
        this.latest[RIGHT] = entry; // E. <-- D
      }
      this.latest = entry;
    }

    private async getFromServerCacheAndSetLocalCache(key) {
      let entry = await getFromServerCache(key, this.serverCacheClient)!;
      console.log(entry);
      if (!entry) {
        return;
      } else {
        this.setLocalCache(key, entry);
      }
    }


  
    private setLocalCache(key, value) {
      let entry = this.keyMap.get(key);
      if (entry) {
        // update existing
        entry.value = value;
        this.updateLatestAndOldest(entry);
        this.updateEntryExpirationTime(entry);
        return this;
      }

      entry = (new LRUMapEntry(key, value, this.expirationTime + Date.now()));
  
      this.keyMap.set(key, entry);
      this.setLatest(entry);
      ++this.size;
      this.purge();
  
      return this;
    }

    private setLatest(entry) {
      if (this.latest) {
        // link previous tail to the new tail (entry)
        this.latest[RIGHT] = entry;
        entry[LEFT] = this.latest;
      } else {
        // we're first in -- yay
        this.oldest = entry;
      }  
      this.latest = entry;
    }

    private purge() {
      /* 
        Default PurgeFactor is 1, If a purge factor is specified at the constructor,
        then use it to purge the cache to the factor provided. i.e. 
        when the cache is purged it's size is reduced at least to 3/4th of the maximum size
      */
      if (this.size > this.limit ) {
        let fillSize = Math.round(this.size * this.fillFactor);
        console.log("purge limit " + fillSize);
        let purgeSize = this.size - fillSize;

        while(purgeSize >= 0) {
          this.shift();
          purgeSize--;
        }
      
      }
    }
  
    private shift() {
      var entry = this.oldest;
      if (entry) {
        if (this.oldest[RIGHT]) {
          // advance the list
          this.oldest = this.oldest[RIGHT];
          this.oldest[LEFT] = undefined;
        } else {
          // the cache is exhausted
          this.oldest = undefined;
          this.latest = undefined;
        }
        // Remove last strong reference to <entry> and remove links from the purged
        // entry being returned:
        entry[RIGHT] = entry[LEFT] = undefined;
        this.keyMap.delete(entry.key);
        --this.size;
        return [entry.key, entry.value];
      }
    }

    private updateEntryExpirationTime(entry: LRUMapEntry<string,string>) {
      entry.expiration = Date.now() + this.expirationTime;
    }

    private checkIfEntryExpired(entry , date: number): boolean {
      return (entry.expiration < date);
    }
  }

  export class LRUMapEntry<K,V> {
    key   :K | any;
    value :V | any;
    expiration: number;

    constructor(key, value, expiration) {
        this.key = key;
        this.value = value;
        this.expiration = expiration;
    }
  }