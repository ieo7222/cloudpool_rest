"use strict";

/**
* @file box_init
* @author hangbok
*
* @description This module is for simplifying process using box api util
*
* @param {object, callback}
*/


const fs = require('fs');
const BoxSDK = require('box-node-sdk');
const client_info = require('../../../config/client_info.js');

module.exports = function(Accesstoken, callback){

  const box_client = client_info.BOX;

  const CLIENT_ID = box_client.getClientId(),
        CLIENT_SECRET = box_client.getClientSecret();

  var sdk = new BoxSDK({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });
  const USER_ACCESS_TOKEN = Accesstoken;
  var client = sdk.getBasicClient(USER_ACCESS_TOKEN);
  callback(client);

}
