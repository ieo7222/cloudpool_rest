
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
      var Accesstoken = req.body.CP_love;
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
      box_util.searchFilelist(userId,folderId,function(fileList){
        res.json({list: fileList});
      });
    });

}
