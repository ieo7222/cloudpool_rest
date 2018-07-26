var initDropbox = require('./dropbox_init'),
  path = require('path'),
  fetch = require('isomorphic-fetch'),
  fs = require('fs'),
  https = require('https'),
  async = require('async'),
  mime = require('mime'),
  request = require('request');
  var buffer = require('buffer');

  var query = {
    // "entries":[
      // {
        // "path": '/tes2.ppt'
        "path": '/test.ppt'
      // }
    // ]
  };
// initDropbox('kFb_ENWtmyUAAAAAAAABe1Megz31l_Y8uYpKU5MVb5A7fPH76XRzzpfhj-gPwHVz', function(dbx){
//   dbx.filesGetThumbnail({path : '/test.jpg'})
//   .then(function(response) {
//     console.log(response);
//     console.log(response.rev);
//     console.log(response.fileBlob);
//   })
// })
  //
  var data = JSON.stringify(query);
  function btoa(str) {
    if (Buffer.byteLength(str) !== str.length)
      throw new Error('bad string!');
    return Buffer(str, 'binary').toString('base64');
  }
  var headers = {
    'Authorization': 'Bearer kFb_ENWtmyUAAAAAAAABe1Megz31l_Y8uYpKU5MVb5A7fPH76XRzzpfhj-gPwHVz',
    'Dropbox-API-Arg': data
  };
  request.post({
      // url: 'https://content.dropboxapi.com/2/files/get_preview',
      url: 'https://content.dropboxapi.com/2/files/get_preview',
      headers: headers
    },
    function(error, response, body) {
      if (error) {

      } else {
        console.log("====================================================");
        console.log(Buffer.from("Hello World").toString('base64'));
        // console.log(Buffer.from(response.body).toString('base64'));

      }
    }
  );
