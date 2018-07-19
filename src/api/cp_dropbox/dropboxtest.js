//
// "use strict";
//
// /**
// * @file dropbox_util
// * @author ikhwan
// *
// * @description This module is composed of convenient functions of dropbox
// *
// */

var initDropbox = require('./dropbox_init')
, path = require('path')
, fetch = require('isomorphic-fetch')
, fs = require('fs')
, https = require('https')
, async = require('async')
, mime = require('mime');



  // deletefile
  // var deletefile = function(Filename, FolderDir){
  //
  //     initDropbox(Accesstoken, function(dbx){
  //       if(FolderDir==""){
  //       var totalDir = "/"+Filename;
  //       }
  //       else{
  //         var totalDir = FolderDir+"/"+Filename;
  //       }
  //
  //       dbx.filesDelete({ path: totalDir})
  //         .then(function (response) {
  //           //삭제후 알림 필요
  //           console.log(response);
  //         })
  //         .catch(function (err) {
  //           console.log(err);
  //         });
  //     });
  //
  // };
  //
  // var downloadfile = function(Filename, FolderDir, req, res){
  //     initDropbox(Accesstoken, function(dbx){
  //       if(FolderDir==""){
  //       var totalDir = "/"+Filename;
  //       }
  //       else{
  //         var totalDir = FolderDir+"/"+Filename;
  //       }
  //
  //       var fullname = Filename.split(".");
  //       var mimetype = mime.getType(fullname[fullname.length-1]);
  //       // var mimetype = mime.lookup(totalDir);
  //       //zo3 같이 분할 파일은 null값
  //       var URL = dbx.filesGetTemporaryLink({path: totalDir});
  //       console.log(mimetype);
  //       console.log(Filename);
  //       var newFileName = encodeURIComponent(Filename);
  //       res.setHeader('Content-disposition', 'attachment; filename*=UTF-8\'\''+newFileName); //origFileNm으로 로컬PC에 파일 저장
  //       res.setHeader('Content-type', mimetype);
  //       URL.then(function(result){
  //         https.get(result.link, function(file) {
  //           // console.log(URL);
  //           console.log(res);
  //           file.pipe(res);
  //                 // .on('finish', () => {
  //                 //   res.redirect('/'+FolderID)
  //                 // }
  //                 // );
  //         });
  //       });
  //     });
  //
  //   };
  //
  // var uploadfile = function(req, res, FileInfo, FolderDir){
  //   initDropbox(Accesstoken, function(dbx){
  //     //여기서 앞단으로 progress bar 계산을 위한 정보를 보낸다 - 현재는 xhr 생각
  //
  //     fs.readFile(FileInfo.path, function (err, contents) {
  //         if (err) {
  //           console.log('Error: ', err);
  //         }
  //         var UploadPath = FolderDir+'/'+FileInfo.name;
  //         //150MB 미만만 가능
  //         dbx.filesUpload({ path: UploadPath, contents: contents })
  //           .then(function (response) {
  //             console.log(response);
  //             res.json("success");
  //           })
  //           .catch(function (err) {
  //             console.log(err);
  //           });
  //       });
  //   });
  //
  //   // // File is bigger than 150 Mb - use filesUploadSession* API
  //   //     const maxBlob = 8 * 1000 * 1000; // 8Mb - Dropbox JavaScript API suggested max file / chunk size
  //   //     var workItems = [];
  //   //
  //   //     var offset = 0;
  //   //     while (offset < file.size) {
  //   //       var chunkSize = Math.min(maxBlob, file.size - offset);
  //   //       workItems.push(file.slice(offset, offset + chunkSize));
  //   //       offset += chunkSize;
  //   //     }
  //   //
  //   //     const task = workItems.reduce((acc, blob, idx, items) => {
  //   //       if (idx == 0) {
  //   //         // Starting multipart upload of file
  //   //         return acc.then(function() {
  //   //           return dbx.filesUploadSessionStart({ close: false, contents: blob})
  //   //                     .then(response => response.session_id)
  //   //         });
  //   //       } else if (idx < items.length-1) {
  //   //         // Append part to the upload session
  //   //         return acc.then(function(sessionId) {
  //   //          var cursor = { session_id: sessionId, offset: idx * maxBlob };
  //   //          return dbx.filesUploadSessionAppendV2({ cursor: cursor, close: false, contents: blob }).then(() => sessionId);
  //   //         });
  //   //       } else {
  //   //         // Last chunk of data, close session
  //   //         return acc.then(function(sessionId) {
  //   //           var cursor = { session_id: sessionId, offset: file.size - blob.size };
  //   //           var commit = { path: '/' + file.name, mode: 'add', autorename: true, mute: false };
  //   //           return dbx.filesUploadSessionFinish({ cursor: cursor, commit: commit, contents: blob });
  //   //         });
  //   //       }
  //   //     }, Promise.resolve());
  //   //
  //   //     task.then(function(result) {
  //   //       var results = document.getElementById('results');
  //   //       results.appendChild(document.createTextNode('File uploaded!'));
  //   //     }).catch(function(error) {
  //   //       console.error(error);
  //   //     });
  //   //
  // };
  // var previewfile = function(req,res){
  //   initDropbox(Accesstoken, function(dbx){
  //     console.log("Preview");
  //     dbx.filesGetPreview({path:'/KakaoTalk_Photo_2018-01-31-16-29-09.jpeg'})
  //     .then(function(response){
  //       res.json(response);
  //       console.log(response);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //     });
  //   })
  // }
  //
  // var changenamefile = function(req,res){
  //   initDropbox(Accesstoken, function(dbx){
  //     console.log("Preview");
  //     dbx.fileRequestsUpdate({ id : 'aIdDrXWwG0YAAAAAAAAAyw', title :'바뀌었다.'})
  //     .then(function(response){
  //       res.json(response);
  //       console.log(response);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //     });
  //   })
  // }
var Accesstoken = 'kFb_ENWtmyUAAAAAAAABXmkgkMo381IwrSZdCoj2voMWz0dRlWPda7Caj0ivnG7X'
  // var coutinuelistfile = function(){
  //   var filelist=[];
  //   initDropbox(Accesstoken,function(dbx){
  //     const fetchData = async () => {
  //       const data = await dbx.filesListFolderContinue({
  //         'cursor': 'AAEP-oJYTCJB-3VLeC1OhDjzSPo1sumsU63kGWSBx-f1MmJw4Nh-XLIoeNiBVyNqp3O0thu-FkNBO5u33uBEtunsdmLvKX93CD2ghUNd6U1i3H0ffvUeTXpf7_jwH0p8Auh1yx07HvY1aOYCIqNX7BxlTF8efglKL2PoikgCsdbBKA',
  //       });
  //       console.log(data.entries);
  //     };
  //     fetchData();
  //   })
  // };
  // coutinuelistfile();

  var listfile = function(Accesstoken, FolderDir, callback){
    var filelist=[];
    initDropbox(Accesstoken, function(dbx){
      console.log("list");
      console.log("FolderDir : " + FolderDir);
      dbx.filesListFolder({path :FolderDir, recursive : true}) //list 원하는 경로
      .then(function(response) {
        async.map(response.entries,
          function(file, callback_list){

            //각각 디렉토리의 파일리스트 읽어오기
            if(file!=undefined){
              if(file['.tag']=='folder'){
                var extension = 'folder';
              }
              else{
                var fullname = file.name.split(".");
                var extension = mime.getType(fullname[fullname.length-1]);
              }
            var path = file.path_display.split("/");
            var fileinfo={
              "id" : file.id,
              "name" : file.name,
              "mimeType" : extension,
              "modifiedTime" : file.server_modified,
              "c_modifiedTime" : file.client_modified,
              "size" : file.size,
              "path_display" : file.path_display
              // "media_info" : file.media_info
              // "parent_shared_foler_id" : file.parent_shared_foler_id
              //no parent id
            };
            filelist.push(fileinfo);
            callback_list(null,"finish")
          }
            else callback_list(null,"finish");
          },
          function(err,result){
              if(err) console.log(err);
              //list 받아오기 완료
              else {
                console.log('Finish the File list');
                callback(filelist);
              }
          }
        );

      })
      .catch(function(error) {
        console.error(error);
      });
    });
  };
  listfile(Accesstoken,'', function(filelist){
    console.log(filelist);
  });
