'use strict';

var express         = require('express');
var app             = require('./package.json');
var bodyParser      = require('body-parser');
var uuid            = require('node-uuid');
var request         = require('superagent');
var cache           = require('memory-cache');
var CircuitBreaker  = require('circuit-breaker-js');
var _               = require('lodash');
var serviceSDK      = require('lc-sdk-node.js');

require('q-superagent')(request);

var DISCOVERY_SERVICE_URLS = (process.env.DISCOVERY_SERVICE_URLS || '').split(/\s*;\s*|\s*,\s*/);
var RETRY_TIMEOUT =  parseInt(process.env.RETRY_TIMEOUT) || 5000;
var CONTRACT_TIMEOUT = parseInt(process.env.CONTRACT_TIMEOUT) || 60000;
var HOOK_URLS = process.env.HOOK_URLS.split(',');

var serviceClient = serviceSDK({ discoveryServers: DISCOVERY_SERVICE_URLS });

var server = express();
server.use(bodyParser.json());
server.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

var catalogItems = [];
var catalogServiceBreaker = new CircuitBreaker({
  timeoutDuration: 1000,
  volumeThreshold: 1,
  errorThreshold: 50
});

//init periodic replication
retryReplicate();
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
    replicate(function(result){
       res.send({message: result.body.rows.length + ' items replicated'});
       success();
    }, failed);
  };

  catalogServiceBreaker.run(command, function() {    
    res.send({ message: 'Replication error' });
  });
});

server.get('/healthcheck', function(req, res){
  res.send({ message: 'OK', version: app.version});
});

server.get('/error', function(req, res){
  console.log(new Error('Error - shut down'));
  process.exit(-1);
});

server.listen(process.env.SERVICE_PORT, function(){
  console.log('Listen on ' + process.env.SERVICE_PORT);
});

function replicate(success, failed) {
  serviceClient.get('couchdb', '/products/_all_docs?include_docs=true')
    .then(function (result) {
      catalogItems = result.body.rows.map(function (itm) {
        itm.doc.id = itm.doc._id;
        delete itm.doc._id;
        delete itm.doc._rev;
        return itm.doc;
      }) || [];
      console.log(result.body.rows.length + ' items replicated');
      console.log(catalogItems);
      return result;
    })
    .then(success, function (error) {
      console.log('Replication error: ' + error);
      if (typeof failed === 'function') failed(error);
    });
}

function retryReplicate() {
  replicate(null, function () {
    setTimeout(retryReplicate, RETRY_TIMEOUT);  
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