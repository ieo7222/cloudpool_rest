"use strict";

/**
* @file dropbox_init
* @author ikhwan
*
* @description This module is for simplifying process using dropbox api util
* @param {object, callback}
*/

// require('isomorphic-fetch');
var Dropbox = require('dropbox').Dropbox;
// 'kFb_ENWtmyUAAAAAAAABXmkgkMo381IwrSZdCoj2voMWz0dRlWPda7Caj0ivnG7X'
module.exports = function(Accesstoken, callback){
        var usr_access_token = Accesstoken;
        var dbx = new Dropbox({ accessToken: usr_access_token });
        callback(dbx);
}
