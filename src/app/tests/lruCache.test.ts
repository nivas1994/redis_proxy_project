import { LocalCache } from "../localCache";
import { initializeClient } from "../../init";

// let lruCache: LruCache;
let localCache : LocalCache;
let cacheClient;

describe('Get request', () => {

    beforeAll(async () => {
        cacheClient = initializeClient(true);
        // lruCache = new LruCache(10, 1000, cacheClient);
        localCache = new LocalCache(3, 1000, cacheClient, 1);
        cacheClient.flushall();
        // await fillRedisCache(lruCache);
        await fillDLLRedisCache(localCache);
    });



    // test('Get from Server Cache ', async () => {

    //     let result = await lruCache.get('1');
    //     expect(result).toEqual('John');

    //     result = await lruCache.get('2');
    //     expect(result).toEqual('Danny');

    //     result = await lruCache.get('3');
    //     expect(result).toEqual('Mob');

    //     result = await lruCache.get('4');
    //     expect(result).toEqual('Harry');

    //     result = await lruCache.get('5');
    //     expect(result).toEqual(null);

    //     lruCache.printCache();
    // });


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

        console.log(localCache.getStats());

        expect(localCache.getStats().cacheHit).toEqual(2);
        expect(localCache.getStats().cacheMiss).toEqual(4);
    });


    test('Least Recently Used Eviction ', async () => {

        localCache.printCache();

        await localCache.put('33', 'pang');
        await localCache.put('44', 'pung');

        let result = await localCache.get('33');
        result = await localCache.get('44');

        localCache.printCache();

        // expect(localCache.hasKey('11')).toBeFalsy();

        // expect(localCache.getStats().size).toEqual(2);


    });


    // test('Check Expiration time  ', async () => {

    //     expect(localCache.hasKey('11')).toBeTruthy();
    //     let result = await localCache.get('11');
    //     expect(result).toEqual('Pot');

    //     expect(localCache.hasKey('22')).toBeTruthy();
    //     result = await localCache.get('22');
    //     expect(result).toEqual('pit');

    //     expect(localCache.hasKey('33')).toBeTruthy();
    //     result = await localCache.get('33');
    //     expect(result).toEqual('poop');

    //     expect(localCache.hasKey('44')).toBeTruthy();
    //     result = await localCache.get('44');
    //     expect(result).toEqual('pin');

    //     expect(localCache.hasKey('55')).toBeFalsy();
    //     result = await localCache.get('55');
    //     expect(result).toEqual(null);

    //     localCache.printCache();
    // });


    afterAll(done => {
        cacheClient.quit();
        done();
    });


    // test('Get from LRU Cache ', async () => {
    //     expect(lruCache.hasKey('1')).toBeTruthy();
    //     expect(lruCache.hasKey('2')).toBeTruthy();
    //     expect(lruCache.hasKey('3')).toBeTruthy();
    //     expect(lruCache.hasKey('4')).toBeTruthy();
    //     expect(lruCache.hasKey('5')).toBeFalsy();


    // });
});


// async function fillRedisCache(lruCache: LruCache) {
//     await lruCache.put('1', 'John');
//     await lruCache.put('2', 'Danny');
//     await lruCache.put('3', 'Mob');
//     await lruCache.put('4', 'Harry');

// }

async function fillDLLRedisCache(dllCache: LocalCache) {
    await dllCache.put('11', 'ping');
    await dllCache.put('22', 'pong');

}