import { LocalCache } from "../localCache";
import { initializeClient } from "../../init";

let localCache : LocalCache;
let cacheClient;

describe('Get request', () => {

    beforeAll(async () => {
        cacheClient = initializeClient(true);
        localCache = new LocalCache(3, 1000, cacheClient, 1);
        cacheClient.flushall();
        await fillDLLRedisCache(localCache);
    });

    test('Get from Server Cache ', async () => {

        let result = await localCache.get('11');
        expect(result).toEqual('ping');

        result = await localCache.get('22');
        expect(result).toEqual('pong');

        result = await localCache.get('55');
        expect(result).toEqual(null);

        console.log(localCache.getStats());
        expect(localCache.getStats().cacheMiss).toEqual(2);
    });

    test('Get from Local Cache ', async () => {

        expect(localCache.hasKey('11')).toBeTruthy();
        let result = await localCache.get('11');
        expect(result).toEqual('ping');

        expect(localCache.hasKey('22')).toBeTruthy();
        result = await localCache.get('22');
        expect(result).toEqual('pong');

        expect(localCache.hasKey('55')).toBeFalsy();
        result = await localCache.get('55');
        expect(result).toEqual(null);

        console.log(localCache.getStats());
        expect(localCache.getStats().cacheHit).toEqual(2);
    });


    test('Global Expiry test  ', async () => {

        await new Promise(resolve => setTimeout(resolve, 2000));

        expect(localCache.hasKey('11')).toBeTruthy();
        let result = await localCache.get('11');
        expect(result).toEqual('ping');
        expect(localCache.hasKey('22')).toBeTruthy();
        result = await localCache.get('22');
        expect(result).toEqual('pong');
        expect(localCache.getStats().cacheHit).toEqual(2);
        expect(localCache.getStats().cacheMiss).toEqual(4);
    });


    test('Least Recently Used Eviction ', async () => {

        await localCache.put('33', 'pang');
        await localCache.put('44', 'pung');

        let result = await localCache.get('33');
        result = await localCache.get('44');

        expect(localCache.hasKey('11')).toBeFalsy();
        expect(localCache.getStats().size).toEqual(3);
        expect(localCache.getLatestKey()).toEqual('pung');
        expect(localCache.getOldestKey()).toEqual('pong');

    });

    test('Testing Limit Factor ', async () => {

        localCache = new LocalCache(5, 1000, cacheClient, 0.50);

        await localCache.put('1', 'one');
        await localCache.put('2', 'two');
        await localCache.put('3', 'three');
        await localCache.put('4', 'four');
        await localCache.put('5', 'five');
        await localCache.put('6', 'five');

        await localCache.get('1');
        await localCache.get('2');
        await localCache.get('3');
        await localCache.get('4');
        await localCache.get('5');
        await localCache.get('6');

        localCache.printCache();
        // Since we have set the limit factor , the last 3 entries ((Math.Round(5 * 0.50)) = 3) would be removed once the size > limit size 
        expect(localCache.getStats().size).toEqual(2);

    });

    afterAll(done => {
        cacheClient.quit();
        done();
    });


});



async function fillDLLRedisCache(dllCache: LocalCache) {
    await dllCache.put('11', 'ping');
    await dllCache.put('22', 'pong');

}