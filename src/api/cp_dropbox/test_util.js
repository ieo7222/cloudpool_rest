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
    "entries":[
      {
        // "path": '/tes2.ppt'
        "path": '/test.jpg',
        "format": "jpeg",
        "size": "w64h64",
        "mode": "strict"
      }
    ]
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
  var headers = {
    'Authorization': 'Bearer kFb_ENWtmyUAAAAAAAABe1Megz31l_Y8uYpKU5MVb5A7fPH76XRzzpfhj-gPwHVz',
    'Content-Type': 'application/json'
  };
  request.post({
      // url: 'https://content.dropboxapi.com/2/files/get_preview',
      url: 'https://content.dropboxapi.com/2/files/get_thumbnail_batch',
      headers: headers,
      body : data
    },
    function(error, response, body) {
      if (error) {

      } else {
        console.log("====================================================");
        var body = JSON.parse(response.body);
        console.log(body.entries[0].thumbnail);
        // var data = response.body.replace(/^data:image\/\w+;base64,/, "");
        // var buf = new Buffer(data, 'base64');
        // fs.writeFile('image.jpeg', buf);
        // // 버퍼의 파일을 쓰기
        // // fs.writeFile(response.body,'./copy.jpg');
        // console.log('******** base64로 인코딩되었던 파일 쓰기 성공 ********');
        // // decode_base64(body,'rane.jpg');
      }
    }
  );
