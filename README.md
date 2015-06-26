#Contract Service

##Configuration parameters

```
export SERVICE_PORT=5011
export CONTRACT_TIMEOUT=60000
export RETRY_TIMEOUT=5000
export DISCOVERY_SERVICE_URLS=http://46.101.138.192:8500,http://46.101.191.124:8500
export HOOK_URLS=http://46.101.191.124:5984/contracts
```

##Build

`docker build -t contract-service .`

##Run locally

`docker run -t -i -p 5011:5011 contract-service`

##Publish into private registry

```
docker tag contract-service 46.101.191.124:5000/contract-service:0.0.7
docker push 46.101.191.124:5000/contract-service:0.0.7
```

##Deploy via Shipyard

```
curl -X POST \
-H 'Content-Type: application/json' \
-H 'X-Service-Key: pdE4.JVg43HyxCEMWvsFvu6bdFV7LwA7YPii' \
http://46.101.191.124:8080/api/containers?pull=true \
-d '{  
  "name":"46.101.191.124:5000/contract-service:0.0.7",
  "cpus":0.1,
  "memory":64,
  "environment":{
    "SERVICE_CHECK_SCRIPT":"curl -s http://46.101.191.124:5011/healthcheck",
    "DISCOVERY_SERVICE_URLS":"http://46.101.138.192:8500,http://46.101.191.124:8500",
    "SERVICE_PORT":"5011",
    "CONTRACT_TIMEOUT":"3600000",
    "RETRY_TIMEOUT":"5000",
    "HOOK_URLS":"http://46.101.191.124:5984/contracts",
    "LOGS":"true"
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
       "port":5011,
       "container_port":5011
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
http://localhost:5011/contracts/abc
```

####Add contract
```
curl -X POST \
-H 'Content-Type: application/json' \
http://192.168.59.103:5011/contracts/abc \
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
http://localhost:5011/replicate
```

###HealthCheck

```
curl -X GET \
-H 'Content-Type: application/json' \
http://localhost:5011/healthcheck
```
