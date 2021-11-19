echo " Initializing tests...."

dataFile='integration_test_data.txt'
outputFile='output.txt'
port='4000'
PROXY_PING_RESPONSE=""
REDIS_PING_RESPONSE=""
SERVER_GET_RESPONSE=""
SERVER_HAS_KEY_RESPONSE=""
SERVER_POST_RESPONSE=""

> $outputFile  # Clearing the output file before running tests


function getValue {
   SERVER_GET_RESPONSE=$(curl http://localhost:${port}/get-value/$1 --silent);
}

function hasKey {
   SERVER_HAS_KEY_RESPONSE=$(curl http://localhost:${port}/has-key/$1 --silent);
}

function addValueToRedis {
   SERVER_POST_RESPONSE=$(curl -d "$1" -H "Content-Type: application/json" -X POST http://localhost:${port}/put-value-to-server-cache --silent);
}


until [ \
  "$(curl -s -w '%{http_code}' -o /dev/null "http://localhost:${port}/ping-local")" \
  -eq 200 ] && [ \
  "$(curl -s -w '%{http_code}' -o /dev/null "http://localhost:${port}/ping-server-cache")" \
  -eq 200 ]
do
  sleep 5
done

echo "\n Running tests..."

echo "\n Running test 1) Pinging the proxy to check if it is alive"

echo "\n 1) Pinging the proxy to check if it is alive " >> $outputFile; 

   SERVER_ALIVE_RESPONSE=$(curl -s "http://localhost:${port}/ping-local"  --silent)

   if [ "$SERVER_ALIVE_RESPONSE" == "PONG" ]; 
   then
      echo "SUCCESS: Local Server Alive" >> $outputFile;
   else
      echo "Local Server Not Alive , Stopping tests" >> $outputFile;
   fi


echo "\n Running test 2) Pinging the proxy to check if the redis server is alive"

echo "\n 2) Pinging the proxy to check if the redis server is alive" >> $outputFile; 

   SERVER_ALIVE_RESPONSE=$(curl -s "http://localhost:${port}/ping-server-cache"  --silent)

   if [ "$SERVER_ALIVE_RESPONSE" == "PONG" ]; 
   then
      echo "SUCCESS: Redis Server Alive" >> $outputFile;
   else
      echo "Redis Server Not Alive , Stopping tests" >> $outputFile;
   fi

# Adding the key-value pair from integration_test_data.txt file to redis

echo "\n Running test 3) Adding Values to the redis cache"
echo "\n 3) Adding Values to the redis cache" >> $outputFile; 

   while IFS= read -r line
   do
    SERVER_RESPONSE=$(curl -d "${line}" -H "Content-Type: application/json" -X POST http://localhost:${port}/put-value-to-server-cache --silent);
    
    if [ "$SERVER_RESPONSE" == "OK" ]; 
    then
    echo "SUCCESS: Addeded data : ${line}" >> $outputFile;
    else
      echo "Could not add data: ${line}" >> $outputFile;
    fi
   done < $dataFile

# Getting the values from the redis server
echo "\n Running test 4) Get Values from redis cache directly"
echo "\n 4) Get Values from redis cache directly" >> $outputFile

    key="22"  
    SERVER_RESPONSE=$(curl http://localhost:${port}/get-value-from-server-cache/${key} --silent);

    if [ "$SERVER_RESPONSE" == "pong" ]; 
    then
      echo "SUCCESS: Got Value from the server cache ${SERVER_RESPONSE}" >> $outputFile;
    else
      echo "FAILED: Could not get value from the sever cache ${SERVER_RESPONSE}" >> $outputFile;
    fi

# Get Values from local cache i.e. first time proxy tries to get the keys <11, 22> from local cache ,
# if not found, gets it from redis and add to local cache)
echo "\n Running test 5) Get Values from local cache"
echo "\n 5) Get Values from local cache" >> $outputFile;


    key="11"  
    getValue $key;

    if [ "$SERVER_GET_RESPONSE" == "ping" ]; 
    then
      echo "SUCCESS: Got Value from the cache for key: $key" >> $outputFile;
    else
      echo "FAILED: Could not get value from the cache for key: $key" >> $outputFile;
    fi

    key="22"  
    getValue $key;

    if [ "$SERVER_GET_RESPONSE" == "pong" ]; 
    then
      echo "SUCCESS: Got Value from the cache for key: $key" >> $outputFile;
    else
      echo "FAILED: Could not get value from the cache for key: $key" >> $outputFile;
    fi

# Get Values from local cache i.e. second time app should return the values from the local cache, Checking if keys <11, 22> is
# available in local cache using hasKey Method
echo "\n Running test 6) Get Values from local cache"
echo "\n 6) Get Values from local cache" >> $outputFile;

    key="11"  
    getValue $key;

    if [ "$SERVER_GET_RESPONSE" == "ping" ]; 
    then
      echo "SUCCESS: Got Value from the cache for key: $key" >> $outputFile;
    else
      echo "FAILED: Could not get value from the cache for key: $key" >> $outputFile;
    fi

    key="22"  
    getValue $key;

    if [ "$SERVER_GET_RESPONSE" == "pong" ]; 
    then
      echo "SUCCESS: Got Value from the cache for key: $key" >> $outputFile;
    else
      echo "FAILED: Could not get value from the cache for key: $key" >> $outputFile;
    fi

    key="11"
    hasKey $key;
  
    if [ "$SERVER_HAS_KEY_RESPONSE" == "true" ]; 
    then
      echo "SUCCESS: local cache has key ${key}" >> $outputFile;
    else
      echo "FAILED: local cache does not contain key ${key}" >> $outputFile;
    fi
    
    key="22"
    hasKey $key;

    if [ "$SERVER_HAS_KEY_RESPONSE" == "true" ]; 
    then
      echo "SUCCESS: local cache has key ${key}" >> $outputFile;
    else
      echo "FAILED: local cache does not contain key ${key}" >> $outputFile;
    fi  

# Max Size of the cache is set to 5. Now add 4 more keys and check if the Least used key "11" is evicted and "12" is set the oldest key
echo "\n Running test 7) LRU Eviction"
echo "\n 7) LRU Eviction" >> $outputFile
    
    arr=("33" "44" "55" "66")
    i=0
    len=${#arr[@]}
    while [ $i -lt $len ];
    do
      key=${arr[$i]}
      getValue $key;
      let i++
    done

    key="11"
    hasKey $key;

    if [ "$SERVER_HAS_KEY_RESPONSE" == "false" ]; 
    then
      echo "SUCCESS: last used key evicted , key : ${key}" >> $outputFile;
    else
      echo "FAILED: last used key not evicted , key ${key}" >> $outputFile;
    fi

   SERVER_RESPONSE=$(curl http://localhost:${port}/get-oldest --silent);

    if [ "$SERVER_RESPONSE" == "22" ]; 
    then
      echo "SUCCESS: Now oldest key in the cache is 22" >> $outputFile;
    else
      echo "FAILED: oldest key in the value is not 22" >> $outputFile;
    fi 
     


echo "\n 8) Get Current stat of local cache" >> $outputFile

    SERVER_RESPONSE=$(curl http://localhost:${port}/get-stats --silent); 

    echo "Current Cache Stat : ${SERVER_RESPONSE}" >> $outputFile;

echo "\n Completed tests..."

