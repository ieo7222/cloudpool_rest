"use strict";

/**
* @file google_init
* @author hangbok
*
* @description This module is for simplifying process of getting google auth
* @param {object, callback}
* return value invovles google user's access and refresh token attributes within
* oauth2Client.credentials
*/
const {google} = require('googleapis');
const client_info = require('../../../config/client_info');
// const mysql = require('mysql');
// const dbutil = require('../db/db_util');

module.exports = function(Accesstoken, callback){

  // Select google client info part out of several drives
  const google_client = client_info.GOOGLE;
  var OAuth2 = google.auth.OAuth2;

  var CLIENT_ID = google_client.getClientId(),
      CLIENT_SECRET = google_client.getClientSecret(),
      REDIRECT_URL = google_client.getRedirectUrl();

  var oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );

 oauth2Client.credentials = {
   access_token: Accesstoken
  //  refresh_token: usr_refresh_token
 };

 callback(oauth2Client);
};
