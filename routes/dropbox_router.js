var fs = require('fs');
var dbxutil = require('../src/api/cp_dropbox/dropbox_util.js');
// var dbxfilter = require('../src/api/cp_dropbox/dropbox_filter.js');
var formidable = require('formidable');
var bodyParser = require('body-parser');
var request = require('request');

var async = require('async'), mime = require('mime');

//스키마 생성
var dbx_file_list = require('../models/dbxfilelist');

// 한글 유니코드 변환
function replaceAll(strTemp, strValue1, strValue2){
          while(1){
              if( strTemp.indexOf(strValue1) != -1 )
                  strTemp = strTemp.replace(strValue1, strValue2);
              else
                  break;
          }
          return strTemp;
   };
function unicodeToKor(before){
  //유니코드 -> 한글
   var after=unescape(replaceAll(before, "\\", "%"));
   return after;
}

module.exports = function(app) {
  // 최초 등록
  app.post('/api/dropbox/set/', function(req, res) {
    var Accesstoken = req.body.CP_love;
    var FolderID = '';
    console.log(Accesstoken);
    dbxutil.list(Accesstoken, FolderID, function(filelist) {
      var dbx_list = new dbx_file_list();
      dbx_list.user_id = req.body.user_id
      dbx_list.accesstoken = Accesstoken;
      dbx_list.check = true;
      dbx_list.folderID = FolderID;
      dbx_list.file_list = filelist;
      dbx_list.save(function(err) {
        if (err) {
          console.error(err);
          res.json({
            result: 0
          });
          return;
        }
        res.json({
          Finishlist: dbx_list.folderID
        });
      });
    });
  });


  // GET ALL filelist
  // app.get('/api/dropbox/checkall/', function(req, res) {
  //   dbx_file_list.find({
  //     user_id: '3'
  //   }, function(err, filelist) {
  //
  //     var search_list = [];
  //     if (err) return res.status(500).send({
  //       error: 'database failure'
  //     });
  //     // console.log(filelist[0].file_list);
  //     async.map(filelist[0].file_list, function(file, callback) {
  //       console.log(file);
  //       var file_name = file.name.split(".")[0];
  //       if (file_name.includes("test")) {
  //         search_list.push(file);
  //       }
  //     });
  //     res.json(search_list);
  //   })
  // });

  // Refresh All filelist
  app.post('/api/dropbox/refresh/', function(req, res) {
    var user_id = req.body.user_id;
    if (req.body.folderID.includes('%25')) {
      var name = req.body.folderID.replace("%25", "%");
      var folder = name;
    } else {
      var folder = unicodeToKor(req.body.folderID);
    }
    // var folder = unicodeToKor(req.body.folderID);
    console.log("refresh folder name is " + folder);
    //accesstoken 몽고디비로부터 가져와야함

    dbxutil.refresh(user_id, folder, function(result) {
      res.json(result);
    });

  });


  // Refresh All filelist
  // app.post('/api/dropbox/refresh/', function(req, res) {
  //   var user_id = req.body.user_id;
  //   if (req.body.folderID.includes('%25')) {
  //     var name = req.body.folderID.replace("%25", "%");
  //     var folder = name;
  //   } else {
  //     var folder = unicodeToKor(req.body.folderID);
  //   }
  //   // var folder = unicodeToKor(req.body.folderID);
  //   console.log("refresh folder name is " + folder);
  //   //accesstoken 몽고디비로부터 가져와야함
  //
  //   dbx_file_list.findOne({
  //     user_id: user_id
  //   }, function(err, list) {
  //     var Accesstoken = list.accesstoken;
  //     //이름 바꾸고 리스트 최신화
  //     var query = {
  //       "path": '',
  //       "recursive": true,
  //       "include_media_info": false,
  //       "include_deleted": false,
  //       "include_has_explicit_shared_members": false,
  //       "include_mounted_folders": true
  //     };
  //     var data = JSON.stringify(query);
  //     var headers = {
  //       'Authorization': 'Bearer ' + Accesstoken,
  //       'Content-Type': 'application/json'
  //     };
  //     request.post({
  //         url: 'https://api.dropboxapi.com/2/files/list_folder',
  //         headers: headers,
  //         body: data
  //       },
  //       function(error, response, body) {
  //         if (error) {
  //           callback("error");
  //         } else {
  //
  //           var result = JSON.parse(body);
  //           console.log(result.entries);
  //         }
  //       }
  //     );
  //
  //   });
  //
  // });

  // GET ALL filelist
  app.post('/api/dropbox/check/', function(req, res) {
    //classify the user_id
    var user_id = req.body.user_id;
    // if (err) return res.status(500).send({
    //   error: 'database failure'
    // });
    if (req.body.folderID.includes('%25')) {
      var name = req.body.folderID.replace("%25", "%");
      var folder = name;
    } else {
      var folder = req.body.folderID;
    }

    // if(req.body.folderID==''||req.body.folderID==undefined){
    //   var folder = '';
    // }
    // else var folder = unicodeToKor(req.body.folderID);
    console.log("folder name is " + folder);
    // var user_file_list = dbx_file_list.find({"user_id" : user_id})
    dbx_file_list.find({
      user_id: user_id
    }, function(err, filelist) {
      dbxutil.filter(filelist[0].file_list, folder, function(request_list) {
        res.json(request_list);
      });
    })
  });

  // Rename the file
  app.post('/api/dropbox/rename/', function(req, res) {
    console.log("rename call");
    var user_id = req.body.user_id;
    if (req.body.folderID.includes('%25')) {
      var name = req.body.folderID.replace("%25", "%");
      var folder = name;
    } else {
      var folder = req.body.folderID;
    }
    // var folder = unicodeToKor(req.body.folderID);
    console.log("folder name is " + folder);
    //accesstoken 몽고디비로부터 가져와야함
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var Accesstoken = list.accesstoken;
      console.log("-------------------------------finish");
      dbxutil.changename(Accesstoken, req.body.file_name, req.body.newName, folder, function(result) {
        if (result == "error") {
          res.json("error");
        } else {
          console.log("result : " + result);
          var nowTime = new Date().getTime();
          //이름 바꾸고 리스트 최신화
          dbxutil.list(Accesstoken, folder, function(filelist) {
            dbx_file_list.update({
              user_id: user_id
            }, {
              $set: {
                check_time: nowTime,
                file_list: filelist
              }
            }, function(err, output) {
              if (err) console.log("error : " + err);
              console.log(output);
              if (!output.n) return console.log('error: dbx_list not found');
              res.json("success");
            })
          });
        }
      });
    });
  });

  // Search the file
  app.post('/api/dropbox/searchtype/', function(req, res) {
    console.log("search type call");
    var user_id = req.body.user_id;
    if (req.body.folderID.includes('%25')) {
      var name = req.body.folderID.replace("%25", "%");
      var folder = name;
    } else {
      var folder = req.body.folderID;
    }
    // var folder = unicodeToKor(req.body.folderID);
    console.log("folder name is " + folder);
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var dbx_file_list = list.file_list;
      //accesstoken 몽고디비로부터 가져와야함
      dbxutil.searchtype(dbx_file_list, req.body.selecttype, folder, function(result) {
        if (result == "error") {
          res.json("error");
        } else {
          console.log(result);
          res.json(result);
        }
      });
    });
  });

  // Search the type
  app.post('/api/dropbox/search/', function(req, res) {
    console.log("search call");
    var user_id = req.body.user_id;
    var keyword = req.body.searchname;

    dbxutil.search(user_id, keyword, function(result) {
      res.json(result);
    });

  });


  // Logout the website by 'check'
  app.post('/api/dropbox/logout/', function(req, res) {
    dbx_file_list.update({
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
        error: 'dbx_list not found'
      });
      res.json({
        message: 'User logout : ' + req.body.user_id
      });
    })
  });


  // Login the website by 'check'
  app.post('/api/dropbox/login/', function(req, res) {
    dbx_file_list.update({
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
        error: 'dbx_list not found'
      });
      res.json({
        message: 'User login : ' + req.body.user_id
      });
    })
  });


  // Delete
  app.post('/api/dropbox/delete/:id', function(req, res) {
    dbx_file_list.remove({
      _id: req.params.id
    }, function(err, output) {
      if (err) return res.status(500).json({
        error: "database failure"
      });
      res.status(204).end();
    });
  });


  // Delete
  app.get('/api/dropbox/delete/', function(req, res) {
    dbx_file_list.remove(function(err, output) {
      if (err) return res.status(500).json({
        error: "database failure"
      });
      res.status(204).end();
    });
  });

  // Move the file to selected Folder
  app.post('/api/dropbox/move/', function(req, res) {
    console.log("move call");
    var user_id = req.body.user_id;
    var fromFile = req.body.fromFile;
    fromFile = fromFile.replace(/[*]/g, "/");
    var toFolder = req.body.toFolder;
    if(toFolder==undefined){
      var toFolder='';
    }
    else{
      toFolder = toFolder.replace(/[*]/g, "/");
    }
    // fromFile = unicodeToKor(req.body.fromFile);
    // toFolder = unicodeToKor(req.body.toFolder);
    if (toFolder.includes('%25')) {
      var name = toFolder.replace("%25", "%");
      toFolder = name;
    }
    if (fromFile.includes('%25')) {
      var name = fromFile.replace("%25", "%");
      fromFile = name;
    }
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var Accesstoken = list.accesstoken;
      dbxutil.move(Accesstoken, user_id, fromFile, toFolder, function(result) {
        if (result == "error") {
          res.json("error");
        } else {
          console.log("result : " + result);
          var nowTime = new Date().getTime();
          //위치 바꾸고 리스트 최신화
          dbxutil.list(Accesstoken, '', function(filelist) {
            dbx_file_list.update({
              user_id: user_id
            }, {
              $set: {
                check_time: nowTime,
                file_list: filelist
              }
            }, function(err, output) {
              if (err) console.log("error : " + err);
              console.log(output);
              if (!output.n) return console.log('error: dbx_list not found');
              res.json("success");
            })
          });
        }
      });
    });
  });

  // Move the file to selected Folder
  app.post('/api/dropbox/makefolder/', function(req, res) {
    console.log("makefolder call");
    var user_id = req.body.user_id;
    var folderDir = req.body.folderDir;
    folderDir = folderDir.replace(/[*]/g, "/");
    if(folderDir.charAt(0)==="/"){
      folderDir= folderDir;
    }
    else{
      folderDir= "/" + folderDir;
    }
    console.log(folderDir);
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var Accesstoken = list.accesstoken;
      dbxutil.makefolder(Accesstoken, folderDir, function(result) {
        if (result == "error") {
          res.json("error");
        } else {
          console.log("make folder result : " + result);
          var nowTime = new Date().getTime();
          //위치 바꾸고 리스트 최신화
          dbxutil.list(Accesstoken, '', function(filelist) {
            dbx_file_list.update({
              user_id: user_id
            }, {
              $set: {
                check_time: nowTime,
                file_list: filelist
              }
            }, function(err, output) {
              if (err) console.log("error : " + err);
              console.log(output);
              if (!output.n) return console.log('error: dbx_list not found');
              res.json("success");
            })
          });
        }
      });
    });
  });


}
