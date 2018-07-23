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
    // "path": '/tes2.ppt'
    "path": '/test.jpeg',
    "format": "jpeg",
    "size": "w64h64",
    "mode": "strict"
  };
  var data = JSON.stringify(query);
  var headers = {
    'Authorization': 'Bearer kFb_ENWtmyUAAAAAAAABe1Megz31l_Y8uYpKU5MVb5A7fPH76XRzzpfhj-gPwHVz',
    'Dropbox-API-Arg': data
  };
  request.post({
      // url: 'https://content.dropboxapi.com/2/files/get_preview',
      url: 'https://content.dropboxapi.com/2/files/get_thumbnail',
      headers: headers
    },
    function(error, response, body) {
      if (error) {

      } else {
        console.log("====================================================");
        console.log(body);
        // var bitmap = new Buffer(body, 'base64');
        // // 버퍼의 파일을 쓰기
        // fs.writeFile(body,'./copy.jpg');
        // console.log('******** base64로 인코딩되었던 파일 쓰기 성공 ********');
        // // decode_base64(body,'rane.jpg');
      }
    }
  );
