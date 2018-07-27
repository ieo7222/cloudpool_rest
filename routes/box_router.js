
var fs = require('fs');
var formidable = require('formidable');
var bodyParser = require('body-parser');
var box_init = require('../src/api/cp_box/box_init.js');
var box_util = require('../src/api/cp_box/box_util.js');


var async = require('async')
, mime = require('mime');

//스키마 생성
var box_file_list = require('../models/boxfilelist');

module.exports = function(app)
{
    // 최초 등록
    app.post('/api/box/set/', function(req, res){
      var Accesstoken = req.body.accesstoken;
      var FolderID = '0';
      box_init(Accesstoken, function(client){
        box_util.listAllFiles(client, FolderID, function(filelist){
          var box_list = new box_file_list();
          box_list.user_id = req.body.user_id;
          box_list.accesstoken = Accesstoken;
          box_list.check = true;
          box_list.file_list= filelist;
          box_list.save(function(err){
            if(err){
              console.error(err);
              res.json({result: 0});
              return;
            }
            res.json({list: filelist });
          });
        });
      });
    });

    app.post('/api/box/check/', function(req, res){
      var userId=req.body.user_id;
      var folderId =req.body.folderID;
      box_util.searchForFolderId(userId,folderId,function(fileList){
        res.json({list: fileList});
      });
    });

    app.post('/api/box/refresh/filelist', function(req, res){
      var userId=req.body.user_id;
      var folderId ='0';
      box_file_list.findOne({
        user_id: userId
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.listAllFiles(client, folderId, function(filelist){
            box_util.refreshFilelist(userId, filelist, function(result){
              res.json(result);
            });
          });
        });
      });
    });

    app.post('/api/box/refresh/token', function(req, res){
      var userId = req.body.user_id;
      var Accesstoken = req.body.accesstoken;
      box_util.refreshToken(userId, Accesstoken, function(result){
        console.log('box refresh token result : '+result);
        res.json(result);
      })
    });

    app.post('/api/box/login/', function(req, res) {
      box_file_list.update({
        user_id: req.body.user_id
      }, {
        $set: {
          "check": true
        }
      }, function(err, output) {
        if (err) res.status(500).json({
          error: 'database failure'
        });
        console.log(output);
        if (!output.n) return res.status(404).json({
          error: 'box_list not found'
        });
        res.json({
          message: 'User login : ' + req.body.user_id
        });
      })
    });

    app.post('/api/box/logout/', function(req, res) {
      box_file_list.update({
        user_id: req.body.user_id
      }, {
        $set: {
          "check": false
        }
      }, function(err, output) {
        if (err) res.status(500).json({
          error: 'database failure'
        });
        console.log(output);
        if (!output.n) return res.status(404).json({
          error: 'box_list not found'
        });
        res.json({
          message: 'User logout : ' + req.body.user_id
        });
      });
    });

    app.post('/api/box/relieve', function(req, res) {
      var userID = req.body.user_id;
      box_file_list.remove({
        user_id: userID
      }, function(err, output) {
        if (err) {
          console.log('[INFO] '+userID+'\'s box_file_lists remove error : '+err)
          res.json(err);
        }
        else {
          console.log('[INFO] '+userID+'\'s box_file_lists removed')
          res.json('success');
        }
      });
    });

    app.post('/api/box/upload', function(req, res) {
      var userID = req.body.user_id;
      var folderID = req.body.folderId;
      var FileInfo = req.body.FileInfo;
      box_file_list.findOne({
        user_id: userID
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.uploadFile(client, folderID, FileInfo, function(uploadfile){
            if(uploadfile==null) {
              res.json('업로드 실패: 해당 폴더에 동일한 이름이 존재합니다');
            } else {
              box_util.uploadFileRest(userID, uploadfile, function(result){
                if(result=='success') res.json(FileInfo.name + " 업로드 완료");
                else res.json(FileInfo.name + " 업로드 실패: "+result);
              });
            }
          });
        });
      });
    });

    app.post('/api/box/delete', function(req, res) {
      var userID = req.body.user_id;
      var fileId = req.body.fileId;
      box_file_list.findOne({
        user_id: userID
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.deleteFile(client, fileId, function(result){
            if(result) {
              box_util.deleteFileRest(userID, fileId, function(result_rest){
                res.json(result_rest);
              });
            }
          });
        });
      });
    });

    app.post('/api/box/create', function(req, res) {
      var user_id = req.body.user_id;
      var folderID = req.body.folderID;
      var foldername = req.body.foldername;
      box_file_list.findOne({
        user_id: user_id
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.createFolder(client, folderID, foldername, function(folder){
            if(folder==null) {
              res.json('폴더 생성 실패: 해당 폴더에 동일한 이름이 존재합니다')
            } else {
              box_util.uploadFileRest(user_id, folder, function(result){
                if(result=='success') res.json(result);
                else res.json('폴더 생성 실패: '+result);
              });
            }
          });
        });
      });
    });

    app.post('/api/box/rename', function(req, res) {
      var userID = req.body.user_id;
      var fileId = req.body.fileId;
      var filename = req.body.filename;
      box_file_list.findOne({
        user_id: userID
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.renameFile(client, fileId, filename, function(result_rename, renamefile){
            if(!result_rename) {
              res.json('이름 바꾸기 실패: 해당 폴더에 동일한 이름이 존재합니다')
            }
            else {
              box_util.deleteFileRest(userID, fileId, function(result_delete){
                if(result_delete=='success'){
                  box_util.uploadFileRest(userID, renamefile, function(result_upload){
                    res.json(result_upload);
                  });
                }
              });
            }
          });
        });
      });
    });

    app.post('/api/box/movepath', function(req, res) {
      var userID = req.body.user_id;
      var fileId = req.body.fileId;
      var pathId = req.body.pathId;
      box_file_list.findOne({
        user_id: userID
      }, function(err, userlist){
        var Accesstoken = userlist.accesstoken;
        box_init(Accesstoken, function(client){
          box_util.movePath(client, fileId, pathId, function(result_move, movefile){
            if(result_move==404) {
              res.json('경로 이동 실패: 해당 폴더를 찾을 수 없습니다');
            } else if(result_move==409) {
              res.json('경로 이동 실패: 해당 폴더에 동일한 이름이 존재합니다');
            }
            else {
              box_util.deleteFileRest(userID, fileId, function(result_delete){
                if(result_delete=='success'){
                  box_util.uploadFileRest(userID, movefile, function(result_upload){
                    res.json(result_upload);
                  });
                }
              });
            }
          });
        });
      });
    });

    app.post('/api/box/search/', function(req, res){
      var userId=req.body.user_id;
      var content =req.body.content;
      box_util.searchForContent(userId,content,function(fileList){
        res.json({list: fileList});
      });
    });
}
