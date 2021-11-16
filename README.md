# Redis Proxy Project

A Redis Proxy Service which uses a LRU Cache

## Features

- Do a HTTP GET to the app to retrieve a value by passing a key
- Do a HTTP POST to store a <Key, Value> Pair

## Architechtrue Overview

![Screen Shot 2021-11-15 at 5 50 43 PM](https://user-images.githubusercontent.com/93060191/141865190-58ed9715-076f-43a2-8de7-f64fb436b732.png)

- The node js application and redis image container talks to each other.
- HTTP calls can be directed towards the ndoe application (proxy) which  which in turn talks to the redis server to retrieve the value if needed.


## Code Flow

- The proxy layer maintains a local LRU cache which gets hit before accessing the redis cache. If key found and not expired , it returns the value.
- If the key is either expired / the local cache doesnt contain the key, then the redis server is hit to get the value.
- If the value is found in the redis server, then it is set to the local cache before it is returned to the service call, based on LRU eviction policy, theleast used key is evicted if the local cache is full . 
- Below Flow chart describes the code flow.

![Redis Proxy Project Code flow](https://user-images.githubusercontent.com/93060191/141868801-9dd18d67-13f8-44c0-8a51-37e54a394573.jpeg)


## Algorithmic Complexities 

- The Local Cache is maintained by a Doubly Linked List and a HashMap (Classic LRU Implementation) which yields a O(1) for retrieving , adding and removing elements from the cache. 
- Note : JS V8 Map has a average time complexity of O(1) , but I have implemented a (Doubly Linked List + Map) approach for the purpose of the project since it has mentioned in the requirements that it tests the candidates ability to build software solution based on a problem statement. 
- Implemented a optional fillFactor that serves for the purpose : put is O(N) in the worst case in classic map implementation, that happens if the cache is filled up on insertion , For example if fill factor is set to : 0.75, when the cache is purged it's size is reduced at least to 3/4th of the maximum size


## Build & Test

### Single Click Build and Test
```
cd redis_proxy_project
make test
```
### Single Click Run
```
cd redis_proxy_project
make build
```

## Time Taken

Component | Time Taken |
--- | --- | 
Requirement Analysis (Redis)   | 1 hrs | 
Docker (Education & Setup)    | 2.5 hrs | 
Project Setup & Integration | 2 hrs |
Cache Implementation | 3 hrs |
Testing Framework    | 2 hrs |
Commenting and Documentation | 2.5 hrs |

## References

- https://docs.redis.com/latest/rs/references/client_references/client_nodejs/
- https://www.interviewcake.com/concept/java/lru-cache
