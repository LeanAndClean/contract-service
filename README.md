#Contract Service

##Service configuration

```
export SERVICE_PORT=5011
export CONTRACT_TIMEOUT=360000
export RETRY_TIMEOUT=5000
export DISCOVERY_SERVICE_URLS=http://46.101.138.192:8500,http://46.101.191.124:8500
export HOOK_URLS=http://46.101.191.124:5984/contracts
export PUBLISH_SERVICE=<ip>:<port>
export SERVICE_VERSION=0.0.10
```

##Build

`docker build -t contract-service .`

##Run locally

`docker run -it -p $SERVICE_PORT:$SERVICE_PORT contract-service`

##Publish into private registry

```
docker tag contract-service:latest $PUBLISH_SERVICE/contract-service:$SERVICE_VERSION
docker push $PUBLISH_SERVICE/contract-service:$SERVICE_VERSION
```

##API

###Contracts

####Get contract

```
curl -X GET \
-H 'Content-Type: application/json' \
http://localhost:$SERVICE_PORT/contracts/abc
```

####Add contract
```
curl -X POST \
-H 'Content-Type: application/json' \
http://localhost:$SERVICE_PORT/contracts/abc \
-d '{
  "cart":{
    "total":"0.666"
  },
  "customer":{
    "name": "my name",
    "address": "my address",
    "zip": "12345"
  }
}'
```

###Replication

```
curl -X GET \
-H 'Content-Type: application/json' \
http://localhost:$SERVICE_PORT/replicate
```

###HealthCheck

```
curl -X GET \
-H 'Content-Type: application/json' \
http://localhost:$SERVICE_PORT/healthcheck
```
