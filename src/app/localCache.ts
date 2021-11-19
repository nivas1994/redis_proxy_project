
/**
 * @author: Nivas Narayanasamy
 * @desc: This class represents the local cache (DLL +HashMap) implementation.
 */

import { LocalCacheInterface } from "./localCacheInterface"; 
import { getFromServerCache, setToServerCache } from "./serverCache";

 //Symbol Declarion for the DLL
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

    constructor(limit, expirationTime, serverCacheClient, fillFactor?) {
      
      this.size = 0;
      this.limit = limit;
      this.expirationTime = expirationTime;
      this.oldest = this.latest = undefined;
      this.serverCacheClient = serverCacheClient;
      this.fillFactor = fillFactor;
      this.keyMap = new Map();
    }
  
    
    public async get(key) {
      /**
       * @desc: This method checks if the key exists in the hashMap else tries to get the 
       *        value for the key from the backing redis instance. And also it acts as a 
       *        read through cache where the values are set in the map when read 
       *        from the redis instance
       */
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
            this.updateLeftAndRightPointers(value);
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
      /**
       * @desc: This method directly sets the value to the backing redis instance 
       */
      await setToServerCache(key, value, this.serverCacheClient);
      let entry = await getFromServerCache(key, this.serverCacheClient);
      return entry;
    }

    public hasKey(key: string): boolean {
      /**
       * @desc: This method checks if the map has the key
       */
      return this.keyMap.has(key);
    } 
    public printCache() {
      console.log(this.keyMap);
    }

    public getLatestKey(): string {
      /**
       * @desc: This method gets the latest value i.e. the last accessed value.
       */
      if (this.latest) {
        return this.latest.key;
      } else {
        return "";
      }
    }

    public getOldestKey(): string {
      /**
       * @desc: This method gets the oldest value i.e. least accessed value.  
       */
      if (this.oldest) {
        return this.oldest.key;
      } else {
        return "";
      }
    }

    public getStats() {
      /**
       * @desc: This method returns the current stat of the cache class
       */
      let stats = {
        'size': this.size,
        'cacheHit': this.cacheHit,
        'cacheMiss': this.cacheMiss,
        'purgeFactor': this.fillFactor,
        'limit': this.limit,
        'expirationTime': this.expirationTime
      };
      return stats;
    }

    private async getFromServerCacheAndSetLocalCache(key) {
      /**
       * @desc: This method tries to get the value for the key from the backing redis instance and processes it.
       */  
      let entry = await getFromServerCache(key, this.serverCacheClient)!;
      console.log(entry);
      if (!entry) {
        return;
      } else {
        this.setLocalCache(key, entry);
      }
    }



    private setLocalCache(key, value) {
      /**
       * @desc: This method tries to get the value for the key from the backing redis instance and processes it.
       */  
      let entry = this.keyMap.get(key);
      if (entry) {
        entry.value = value;
        this.updateLeftAndRightPointers(entry);
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

    private updateLeftAndRightPointers(entry) {
      /**
       * @desc: This method updates the left and right pointers to the entry in the doubly linked list. 
       * @example: If the node 4 is used recently, then it has to moved to the tail
       *              // HEAD--------------TAIL
                        <.oldest   .latest>
                        <--- add direction --
                        1  2  3  <4>  5 
       */
      if (entry === this.latest) {
        // entry is already the most recently used entry , so just return
        return;
      }
      if (entry[RIGHT]) {
        if (entry === this.oldest) {
          this.oldest = entry[RIGHT];
        }
        entry[RIGHT][LEFT] = entry[LEFT]; // 3 <-- 5
      }
      if (entry[LEFT]) {  
        entry[LEFT][RIGHT] = entry[RIGHT]; // 3 --> 5
      }
      entry[RIGHT] = undefined; // 4 = NULL
      entry[LEFT] = this.latest; // 4 --> 5
      if (this.latest) {
        this.latest[RIGHT] = entry; // 5 <-- 4
      }
      this.latest = entry;
    }


    private setLatest(entry) {
      /**
       * @desc: This method updates the previous tail and sets it to the latest added entry
       */ 
      if (this.latest) {
        this.latest[RIGHT] = entry;
        entry[LEFT] = this.latest;
      } else {
        this.oldest = entry;
      }  
      this.latest = entry;
    }

    private purge() {
      /**
       * @desc: this method purges when the size > the max size. 
       * @note: Default PurgeFactor is 1, If a purge factor is specified at the constructor,
       *        then use it to purge the cache to the factor provided. i.e. 
       *        when the cache is purged it's size is reduced at least to 3/4th of the maximum size
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
      /**
       * @desc: This method removes the head node i.e the least used element in the cache 
       */ 
      var entry = this.oldest;
      if (entry) {
        if (this.oldest[RIGHT]) {
          this.oldest = this.oldest[RIGHT];
          this.oldest[LEFT] = undefined;
        } else {
          // Cache is empty
          this.oldest = undefined;
          this.latest = undefined;
        }
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