'use strict';

var express         = require('express');
var bodyParser      = require('body-parser');
var uuid            = require('node-uuid');
var cache           = require('memory-cache');
var CircuitBreaker  = require('circuit-breaker-js');
var q               = require('q');
var request         = require('superagent');
var _               = require('lodash');

require('q-superagent')(request);

var server = express();
server.use(bodyParser.json());
server.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

var CATALOG_SERVICE_FULL_URL = process.env.CATALOG_SERVICE_URL + '/products/_all_docs?include_docs=true';
var RETRY_TIMEOUT =  parseInt(process.env.RETRY_TIMEOUT) || 5000;
var CONTRACT_TIMEOUT = parseInt(process.env.CONTRACT_TIMEOUT) || 60000;
var HOOK_URLS = process.env.HOOK_URLS.split(',');

var catalogItems = [];
var catalogServiceBreaker = new CircuitBreaker({
  timeoutDuration: 1000,
  volumeThreshold: 1,
  errorThreshold: 50
});

//init periodic replication
retryReplicate(CATALOG_SERVICE_FULL_URL);
push();


server.get('/contracts/:key?', function(req, res){
  var contract = cache.get(req.params.key);
  if(!contract) contract = {};
  
  res.send(contract);  
});

server.post('/contracts/:key?', function(req, res){
  var contractId = uuid.v4();
  var cartId = req.params.key;
  var customer  = req.body.customer;
  var cart  = req.body.cart;
  
  if(!cartId) return res.send({message: '`key` is missing'});
  if(!customer) return res.send({message: '`customer` is missing'});
  if(!cart) return res.send({message: '`cart` is missing'});

  if(!customer.name) return res.send({message: '`customer.name` is missing'});
  if(!customer.address) return res.send({message: '`customer.address` is missing'});
  if(!customer.zip) return res.send({message: '`customer.zip` is missing'});
  
  if(customer.zip.length !== 5) return res.send({message: '`customer.zip` is invalid'});
  if(!cart.total) return res.send({message: '`cart.total` is invalid'});

  var payload = {
    contractId: contractId,
    cartId: cartId,
    cart: cart,  
    customer: customer,
    timestamp: Date.now(),
    datetime: new Date()
  };

  cache.put(contractId, payload, CONTRACT_TIMEOUT);
  res.send({contract: payload, message: 'accepted'});
});

server.get('/replicate', function(req, res){
  var command = function(success, failed) {
   replicate(CATALOG_SERVICE_FULL_URL, function(result){
    res.send({message: result.body.length + ' items replicated'});
    success();
   }, failed)
  };

  catalogServiceBreaker.run(command, function() {    
    res.send({ message: 'Replication error' });
  });
});

server.get('/healthcheck', function(req, res){
  res.send({ message: 'OK'});
});

server.listen(process.env.SERVICE_PORT, function(){
  console.log('Listen on ' + process.env.SERVICE_PORT);
});

function replicate(path, success, failed){
  request
    .get(path)
    .set('Connection','keep-alive')
    .accept('json')
    .timeout(2000)
    .q()
    .then(function(result){
      catalogItems = result.body || [];
      console.log(result.body.length + ' items replicated');
      console.log(result.body);
      return result;
    })
    .then(success)
    .fail(function(error){
      console.log(path + ' - Replication error');
      failed();
    });
}

function retryReplicate(CATALOG_SERVICE_FULL_URL){
  replicate(CATALOG_SERVICE_FULL_URL, null, function(){
    setTimeout(function(){
      retryReplicate(CATALOG_SERVICE_FULL_URL);
    }, RETRY_TIMEOUT);  
  });  
}

function push(){
  setInterval(function(){

    cache.keys().forEach(function(key){

      HOOK_URLS.forEach(function(url){
        
        var value = cache.get(key);
        if(!value) return;
        
        //avoid duplicates via explicit id
        value._id = value.cartId;

        callWebhook(url, key, value);
      });
      
    });

  }, 2000);
}

function callWebhook(path, key, value){
  request
    .post(path)
    .set('Content-Type', 'application/json')
    .timeout(2000)
    .send(value)
    .q()
    .then(function(result){
      cache.del(key);
      console.log(path + ' - webhook successful');
    })
    .fail(function(error){
      console.log({message: path + ' - webhook failure', error: error.message});
    });
}