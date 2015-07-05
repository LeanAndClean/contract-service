#Contract Service

##Service configuration

```
export SERVICE_PORT=5011
export CONTRACT_TIMEOUT=360000
export RETRY_TIMEOUT=5000
export DISCOVERY_SERVICE_URLS=http://46.101.138.192:8500,http://46.101.191.124:8500
export HOOK_URLS=http://46.101.191.124:5984/contracts
```

##Deploy configuration

```
export SERVICE_VERSION=0.0.10
export PUBLISH_SERVICE=<ip>:<port>
export DEPLOY_SERVICE=<ip>:<port>
```

##Build

`docker build -t contract-service .`

##Run locally

`docker run -t -i -p $SERVICE_PORT:$SERVICE_PORT contract-service`

##Publish into private registry

```
docker tag contract-service $PUBLISH_SERVICE/contract-service:$SERVICE_VERSION
docker push $PUBLISH_SERVICE/contract-service:$SERVICE_VERSION
```

##Deploy via Shipyard

```
curl -X POST \
-H 'Content-Type: application/json' \
-H 'X-Service-Key: pdE4.JVg43HyxCEMWvsFvu6bdFV7LwA7YPii' \
http://$DEPLOY_SERVICE/api/containers?pull=true \
-d '{  
  "name":"'$PUBLISH_SERVICE'/contract-service:'$SERVICE_VERSION'",
  "cpus":0.1,
  "memory":32,
  "environment":{
    "SERVICE_CHECK_SCRIPT":"curl -s http://$SERVICE_CONTAINER_IP:$SERVICE_CONTAINER_PORT/healthcheck",
    "DISCOVERY_SERVICE_URLS":"'$DISCOVERY_SERVICE_URLS'",
    "SERVICE_PORT":"'$SERVICE_PORT'",
    "CONTRACT_TIMEOUT":"'$CONTRACT_TIMEOUT'",
    "RETRY_TIMEOUT":"'$RETRY_TIMEOUT'",
    "HOOK_URLS":"'$HOOK_URLS'",
    "LOG":"true"
  },
  "hostname":"",
  "domain":"",
  "type":"service",
  "network_mode":"bridge",
  "links":{},
  "volumes":[],
  "bind_ports":[  
    {  
       "proto":"tcp",
       "host_ip":null,
       "port":'$SERVICE_PORT',
       "container_port":'$SERVICE_PORT'
    }
  ],
  "labels":[],
  "publish":false,
  "privileged":false,
  "restart_policy":{  
    "name":"no"
  }
}'
```

##API

###Contracts

####Get contract

```
curl -X GET \
-H 'Content-Type: application/json' \
http://$DEPLOY_SERVICE:$SERVICE_PORT/contracts/abc
```

####Add contract
```
curl -X POST \
-H 'Content-Type: application/json' \
http://$DEPLOY_SERVICE:$SERVICE_PORT/contracts/abc \
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
http://$DEPLOY_SERVICE:$SERVICE_PORT/replicate
```

###HealthCheck

```
curl -X GET \
-H 'Content-Type: application/json' \
http://$DEPLOY_SERVICE:$SERVICE_PORT/healthcheck
```
