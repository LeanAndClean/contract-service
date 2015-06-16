#Contract Service

##Configuration parameters

```
export SERVICE_PORT=5011
export CONTRACT_TIMEOUT=60000
export RETRY_TIMEOUT=5000
export CATALOG_SERVICE_URL=http://46.101.191.124:5005/products
```

##Build

`docker build -t contract-service .`

##Run locally

`docker run -t -i -p 5011:5011 contract-service`

##Publish into private registry

```
docker tag contract-service 46.101.191.124:5000/contract-service:0.0.3
docker push 46.101.191.124:5000/contract-service:0.0.3
```

##Deploy via Shipyard

```
curl -X POST \
-H 'Content-Type: application/json' \
-H 'X-Service-Key: pdE4.JVg43HyxCEMWvsFvu6bdFV7LwA7YPii' \
http://46.101.191.124:8080/api/containers?pull=true \
-d '{  
  "name":"46.101.191.124:5000/contract-service:0.0.3",
  "cpus":0.1,
  "memory":64,
  "environment":{
    "SERVICE_CHECK_SCRIPT":"curl -s http://46.101.191.124:5011/healthcheck",
    "CATALOG_SERVICE_URL":"http://46.101.191.124:5005/products",
    "SERVICE_PORT":"5011",
    "CONTRACT_TIMEOUT":"3600000",
    "RETRY_TIMEOUT":"5000"
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
  "labels":["docker"],
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
http://localhost:5011/contracts
```

####Add contract
```
curl -X POST \
-H 'Content-Type: application/json' \
http://localhost:5011/contracts \
-d '
'
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
