"use strict";

/**
 * @file dropbox_util
 * @author ikhwan
 *
 * @description This module is composed of convenient functions of dropbox
 *
 */

var initDropbox = require('./dropbox_init'),
  path = require('path'),
  fetch = require('isomorphic-fetch'),
  fs = require('fs'),
  https = require('https'),
  async = require('async'),
  mime = require('mime'),
  request = require('request');

var mimelist = {
  "document": ['application/x-abiword', 'text/css', 'text/csv', 'application/msword', 'application/vnd.oasis.opendocument.presentation', 'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.text', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'],
  "pdf": ['application/pdf'],
  "video": ['video/x-msvideo', 'video/ogg', 'video/webm', 'video/mp4', 'video/mpeg', 'video/avi', 'video/wmv', 'video/mkv', 'video/mpg'],
  "image": ['image/gif', 'image/x-icon', 'image/jpeg', 'image/svg+xml', 'image/tiff', 'image/webp', 'image/jpg'],
  "audio": ['audio/aac', 'audio/midi', 'audio/ogg', 'audio/x-wav', 'audio/webm', 'audio/mp3', 'audio/wma']
  // "etc":
};

//스키마 생성
var dbx_file_list = require('../../../models/dbxfilelist');

Array.prototype.equals = function(array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;
  // compare lengths - can save a lot of time
  if (this.length != array.length)
    return false;
  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}
Object.defineProperty(Array.prototype, 'equals', {
  enumerable: false
});


const UTIL = (function() {

  // var connection = db_con.init();

  /****************************************************************************
   * @description simplify connection with db pool
   * @param {callback}
   *
   */
  var refreshfile = function(user_id, folder, callback) {
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var Accesstoken = list.accesstoken;
      var nowTime = new Date().getTime();
      //이름 바꾸고 리스트 최신화
      listfile(Accesstoken, folder, function(filelist) {
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
          callback("success");
        })
      });

    });
  }

  var previewfile = function(req, res) {
    initDropbox(Accesstoken, function(dbx) {
      console.log("Preview");
      dbx.filesGetPreview({
          path: '/KakaoTalk_Photo_2018-01-31-16-29-09.jpeg'
        })
        .then(function(response) {
          res.json(response);
          console.log(response);
        })
        .catch(function(err) {
          console.log(err);
        });
    })
  }

  var changenamefile = function(Accesstoken, filename, newname, FolderDir, callback) {
    var query = {
      "from_path": FolderDir + "/" + filename,
      "to_path": FolderDir + "/" + newname,
      "allow_shared_folder": false,
      "autorename": false,
      "allow_ownership_transfer": false
    };
    var data = JSON.stringify(query);
    var headers = {
      'Authorization': 'Bearer ' + Accesstoken,
      'Content-Type': 'application/json'
    };
    request.post({
        url: 'https://api.dropboxapi.com/2/files/move_v2',
        headers: headers,
        body: data
      },
      function(error, response, body) {
        if (error) {
          callback("error");
        } else {
          console.log(body);
          callback("success");
        }
      }
    );
  }



  var coutinuelistfile = function() {
    var filelist = [];
    initDropbox(Accesstoken, function(dbx) {
      const fetchData = async () => {
        const data = await dbx.filesListFolderContinue({
          'cursor': 'YOUR_CURSOR_HERE',
        });
        console.log(data);
      };
    })
  }


  var listfile = function(Accesstoken, FolderDir, callback) {
    var filelist = [];
    initDropbox(Accesstoken, function(dbx) {
      console.log("list");
      console.log("FolderDir : " + FolderDir);
      dbx.filesListFolder({
          path: FolderDir,
          recursive: true
        }) //list 원하는 경로
        .then(function(response) {
          async.map(response.entries,
            function(file, callback_list) {
              //각각 디렉토리의 파일리스트 읽어오기
              if (file != undefined) {
                if (file['.tag'] == 'folder') {
                  var extension = 'folder';
                } else {
                  var fullname = file.name.split(".");
                  var extension = mime.getType(fullname[fullname.length - 1]);
                }
                var path = file.path_display.split("/");
                var fileinfo = {
                  "id": file.id,
                  "name": file.name,
                  "mimeType": extension,
                  "modifiedTime": file.server_modified,
                  "c_modifiedTime": file.client_modified,
                  "size": file.size,
                  "path_list": path
                  //no parent id
                };
                filelist.push(fileinfo);
                callback_list(null, "finish")
              } else callback_list(null, "finish");
            },
            function(err, result) {
              if (err) console.log(err);
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

  var searchtypefile = function(dbx_file_list, keytype, folderID, callback) {
    var typelist = [];
    if (keytype == "document") {
      var mimetype = mimelist.document;
    } else if (keytype == "PDF") {
      var mimetype = mimelist.pdf;
    } else if (keytype == "video") {
      var mimetype = mimelist.video;
    } else if (keytype == "image") {
      var mimetype = mimelist.image;
    } else if (keytype == "audio") {
      var mimetype = mimelist.audio;
    }

    async.map(dbx_file_list,
      function(file, callback_list) {
        var file_type = file.mimeType;
        async.map(mimetype,
          function(type, callback_type) {

            if (file_type == type) {
              typelist.push(file);
              callback_type(null, 'finish');
            } else {
              callback_type(null, 'fail');
            }
          },
          function(err, result_type) {
            if (err) {
              console.log(err);
              callback_list(null, 'finish');
            }
            //list 받아오기 완료
            else {
              callback_list(null, 'fail');
            }
          }
        )
      },
      function(err, result) {
        if (err) {
          console.log(err);
          callback("Fail the Folder list");
        }
        //list 받아오기 완료
        else {
          console.log('Finish the File list');
          callback(typelist);
        }
      }
    );

  }

  var filterfile = function(dbx_file_list, folderpath, callback) {
    var filter_file_list = [];
    var folderID = folderpath.split("/");

    async.map(dbx_file_list,
      function(file, callback_list) {
        var path_size = file.path_list.length;
        var refine_list = file.path_list.slice(0, path_size - 1);
        if (folderID.equals(refine_list)) {
          filter_file_list.push(file);
          callback_list(null, "finish")
        } else callback_list(null, "finish");
      },
      function(err, result) {
        if (err) {
          console.log(err);
          callback("Fail the Folder list");
        }
        //list 받아오기 완료
        else {
          console.log('Finish the File list');

          callback(filter_file_list);
        }
      }
    );


  };

  var searchfile = function(user_id, keyword, callback) {
    dbx_file_list.findOne({
      user_id: user_id
    }, function(err, list) {
      var search_list = [];
      if (err) return res.status(500).send({
        error: 'database failure'
      });
      async.map(list.file_list, function(file, callback) {
        var file_name = file.name.split(".")[0];
        if (file_name.includes(keyword)) {
          search_list.push(file);
        }
      });
      callback(search_list);
    });
  }

  var movefile = function(Accesstoken, user_id, fromFile, toFolder, callback) {
    var filesplit = fromFile.split("/");
    var filename = filesplit[filesplit.length - 1];
    if(toFolder==''||toFolder==undefined){
      var to_path ="/"+filename;
    }
    else var to_path = "/" + toFolder + "/" + filename;
    var query = {
      "from_path": fromFile,
      "to_path": to_path,
      "allow_shared_folder": false,
      "autorename": false,
      "allow_ownership_transfer": false
    };
    console.log(query.from_path);
    console.log(query.to_path);
    var data = JSON.stringify(query);
    var headers = {
      'Authorization': 'Bearer ' + Accesstoken,
      'Content-Type': 'application/json'
    };
    request.post({
        url: 'https://api.dropboxapi.com/2/files/move_v2',
        headers: headers,
        body: data
      },
      function(error, response, body) {
        if (error) {
          callback("error");
        } else {
          console.log(body);
          callback("success");
        }
      }
    );
  }

  var makefolder = function(Accesstoken, folderDir, callback) {

    var query = {
      "path": folderDir,
      "autorename": false
    };
    var data = JSON.stringify(query);
    var headers = {
      'Authorization': 'Bearer ' + Accesstoken,
      'Content-Type': 'application/json'
    };
    request.post({
        url: 'https://api.dropboxapi.com/2/files/create_folder_v2',
        headers: headers,
        body: data
      },
      function(error, response, body) {
        if (error) {
          callback("error");
        } else {
          console.log(body);
          callback("success");
        }
      }
    );
  }

  return {
    list: listfile,
    preview: previewfile,
    changename: changenamefile,
    continuelist: coutinuelistfile,
    searchtype: searchtypefile,
    filter: filterfile,
    refresh: refreshfile,
    search: searchfile,
    move: movefile,
    makefolder : makefolder
  }

})();

module.exports = UTIL;
