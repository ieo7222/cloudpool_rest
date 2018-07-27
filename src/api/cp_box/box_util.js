module.exports = (function(){
  var async = require('async');
  var fs = require('fs');
  var box_file_list = require('../../../models/boxfilelist');
  var mime = require('mime');

  var mimelist = {
    "document": ['application/x-abiword', 'text/css', 'text/csv', 'application/msword', 'application/vnd.oasis.opendocument.presentation', 'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.text', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'],
    "pdf": ['application/pdf'],
    "video": ['video/x-msvideo', 'video/ogg', 'video/webm', 'video/mp4', 'video/mpeg', 'video/avi', 'video/wmv', 'video/mkv', 'video/mpg'],
    "image": ['image/gif', 'image/x-icon', 'image/jpeg', 'image/svg+xml', 'image/tiff', 'image/webp', 'image/jpg', 'image/png'],
    "audio": ['audio/aac', 'audio/midi', 'audio/ogg', 'audio/x-wav', 'audio/webm', 'audio/mp3', 'audio/wma']
    // "etc":
  };

  var listAllFiles = function(client, folderId, callback) {
    client.folders.getItems(
      folderId,
      {
        fields: 'name,size,modified_at'
      })
      .then(function(items){
        var filelist = [];
        async.map(items.entries, function(item, callback_list){
          if(item.type=='folder'){
            var iteminfo = {
              'id' : item.id,
              'name' : item.name,
              'type' : item.type,
              'modifiedTime' : item.modified_at,
              'size' : item.size,
              'parents' : folderId
            }
            filelist.push(iteminfo);
            listAllFiles(client,item.id,function(filelist_child){
              filelist = filelist.concat(filelist_child);
              callback_list(null, "finish");
            });
          } else {
            var fullname = item.name.split(".");
            var extension = mime.getType(fullname[fullname.length - 1]);
            var iteminfo = {
              'id' : item.id,
              'name' : item.name,
              'type' : item.type,
              'mimeType' : extension,
              'modifiedTime' : item.modified_at,
              'size' : item.size,
              'parents' : folderId
            }
            filelist.push(iteminfo);
            callback_list(null, "finish");
          }
        }, function(err, result){
          if(err) console.log(err);
          else {
            callback(filelist);
          }
        });
      });
    }

  var findFolderPath = function(userId, folderId, callback){
    var Option={
      "user_id":userId
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
        callback(null);
      }
      else if(userlist[0]==null) {
        console.log('filelist are saving...');
        callback(null);
      }
      else {
        var folderpath =[];
        var pathname=[];
        if(folderId==0){
          folderpath.push(folderId);
          pathname.push('Box');
        }
        async.map(userlist[0].file_list,
          function(file,callback_list){
            if(file.id==folderId) {
              folderpath.push(file.id);
              pathname.push(file.name);
              findFolderPath(userId, file.parents, function(folderpath_child, pathname_child){
                folderpath = folderpath.concat(folderpath_child);
                pathname = pathname.concat(pathname_child);
                callback_list(null);
              })
            } else {
              callback_list(null);
            }
          },
          function(err,result){
            if(err) {
              console.log("box_util findFolderPath err : "+err);
              callback(null);
            }
            else {
              callback(folderpath, pathname);
            }
          }
        );
      }
    });
  }

  var searchForFolderId = function (userId, folderId, callback){
    var Option={
      "user_id":userId
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
        callback(null);
      }
      else if(userlist[0]==null) {
        console.log('filelist are saving...');
        callback(null);
      }
      else {
        var filteredList =[];
        async.map(userlist[0].file_list,
          function(file,callback_list){
            if(file.id==folderId){
              var beforeFolder = {
                'id' : file.parents,
                'name' : '..',
                'type' : 'folder'
              }
              filteredList.push(beforeFolder);
            }
            else if(file.parents==folderId){
              filteredList.push(file);
            }
            callback_list(null);
          },
          function(err,result){
            if(err) {
              console.log("Fail the Folder list error code : ",err);
              callback(null);
            }
            else {
              callback(filteredList);
            }
          }
        );
      }
    });
  }

  var searchForContent = function (userId, content, callback){
    var Option={
      "user_id":userId
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
      }
      else{
        var filteredList =[];
        var beforeFolder = {
          'id' : 0,
          'name' : '..',
          'type' : 'folder'
        }
        filteredList.push(beforeFolder);
        async.map(userlist[0].file_list,
          function(file,callback_list){
            if(file.name.indexOf(content) != -1){
              filteredList.push(file);
            }
            callback_list(null);
          },
          function(err,result){
            if(err) {
              console.log("Fail the Folder list error code : ",err);
              callback(null);
            }
            else {
              callback(filteredList);
            }
          }
        );
      }
    });
  }

  var searchForSelectType = function (userId, selecttype, callback){
    var Option={
      "user_id":userId
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
      }
      else{
        var filteredList =[];
        if (selecttype == "document") {
          var mimetype = mimelist.document;
        } else if (selecttype == "PDF") {
          var mimetype = mimelist.pdf;
        } else if (selecttype == "video") {
          var mimetype = mimelist.video;
        } else if (selecttype == "image") {
          var mimetype = mimelist.image;
        } else if (selecttype == "audio") {
          var mimetype = mimelist.audio;
        }
        var beforeFolder = {
          'id' : 0,
          'name' : '..',
          'type' : 'folder'
        }
        filteredList.push(beforeFolder);
        async.map(userlist[0].file_list, function(file,callback_list){
          if(file.type=='folder') {
            callback_list(null);
          } else {
            async.map(mimetype, function(type, callback_type){
              if(file.mimeType == type){
                filteredList.push(file);
                callback_type(null);
              } else callback_type(null);
            }, function(err,result){
              if(err) {
                console.log('box_util err : '+err);
                callback_list(null);
              } else {
                callback_list(null);
              }
            });
          }
        },
        function(err,result){
          if(err) {
            console.log("box_util err : "+err);
            callback(null);
          }
          else {
            callback(filteredList);
          }
        });
      }
    });
  }

  var refreshFilelist = function(user_id, filelist, callback){
    var nowTime = new Date().getTime();
    box_file_list.update({
      user_id: user_id
    }, {
      $set: {
        check_time: nowTime,
        file_list: filelist
      }
    }, function(err, output) {
      if (err) callback("error : " + err);
      else if (!output.n) callback('error: box_list not found');
      else callback("success");
    })
  }

  var refreshToken = function(user_id, accesstoken, callback){
    box_file_list.update({
      user_id: user_id
    }, {
      $set: {
        accesstoken: accesstoken
      }
    }, function(err, output) {
      if (err) callback("error : " + err);
      else callback("success");
    })
  }

  var uploadFile = function(client, FolderID, FileInfo, callback){
    var stream = fs.createReadStream(FileInfo.path);
    client.files.uploadFile(FolderID, FileInfo.name, stream, function(err, newfile){
      if(err) {
        callback(null);
      }
      else{
        //파일 아이디
        console.log(newfile.entries[0].id);
        var uploadfile = {
          'id' : newfile.entries[0].id,
          'name' : newfile.entries[0].name,
          'type' : newfile.entries[0].type,
          'modifiedTime' : newfile.entries[0].modified_at,
          'size' : newfile.entries[0].size,
          'parents' : FolderID
        }
        callback(uploadfile);
      }
    });
  }

  var uploadFileRest = function(userId, uploadfile, callback) {
    box_file_list.update({
      user_id: userId
    }, {
      $push: {
        file_list: uploadfile
      }
    }, function(err, output) {
      if (err) callback("error : " + err);
      else if (!output.n) callback('error: box_list not found');
      else callback("success");
    })
  }

  var downloadFile = function(client, fileId){
    client.files.getReadStream(fileId).then(stream => {
      client.files.get(fileId).then(file => {
        var fileName = file.name;
        console.log(fileName);
        var output = fs.createWriteStream('../app_modules/cpbox/download/'+fileName);
        stream.pipe(output);
      })
    })
  }

  var deleteFile = function(client, fileId, callback){
    client.files.delete(fileId, function(err) {
      if(err) {
        client.folders.delete(fileId, {recursive:true}, function(err_folder) {
          if(err_folder) {
            console.log('deletion err : '+err_folder);
            callback(0);
          } else {
            console.log('folder deletion succeeded');
            callback(1);
          }
        });
      } else {
        console.log('file deletion succeeded');
        callback(1);
      }
    });
  }

  var deleteFileRest = function(user_id, fileId, callback){
    var Option={
      "user_id":user_id
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
      }
      else{
        var deletefile;
        async.map(userlist[0].file_list,
          function(file,callback_list){
            if(file.id==fileId){
              deletefile = file;
            }
            callback_list(null);
          },
          function(err,result){
            if(err) {
              console.log("Fail the find deletefile error code : ",err);
              callback(err);
            }
            else {
              box_file_list.update({
                user_id: user_id
              }, {
                $pull: {
                  file_list: deletefile
                }
              }, function(err, output) {
                if (err) callback("error : " + err);
                else if (!output.n) callback('error: box_list not found');
                else callback("success");
              })
            }
          }
        );
      }
    });
  }

  var createFolder = function(client, folderID, foldername, callback) {
    client.folders.create(folderID, foldername, function(err, newfolder){
      if(err) {
        callback(null);
      }
      else {
        var folder = {
          'id' : newfolder.id,
          'name' : newfolder.name,
          'type' : newfolder.type,
          'modifiedTime' : newfolder.modified_at,
          'size' : newfolder.size,
          'parents' : folderID
        }
        callback(folder);
      }
    });
  }

  var renameFile = function(client, fileId, newname, callback){
    client.files.update(fileId, {name : newname}, function(err, updatedFile) {
      if(err) {
        client.folders.update(fileId, {name : newname}, function(err, updatedFolder) {
          if(err) {
            console.log('renaming err : '+err);
            callback(0, 'null');
          } else {
            var uploadfile = {
              'id' : updatedFolder.id,
              'name' : updatedFolder.name,
              'type' : updatedFolder.type,
              'modifiedTime' : updatedFolder.modified_at,
              'size' : updatedFolder.size,
              'parents' : updatedFolder.parent.id
            }
            console.log('renaming folder completed');
            callback(1, uploadfile);
          }
      	});
      } else {
        var uploadfile = {
          'id' : updatedFile.id,
          'name' : updatedFile.name,
          'type' : updatedFile.type,
          'modifiedTime' : updatedFile.modified_at,
          'size' : updatedFile.size,
          'parents' : updatedFile.parent.id
        }
        console.log('renaming file completed');
        callback(1, uploadfile);
      }
  	});
  }

  var movePath = function(client, fileId, pathId, callback){
    client.files.update(fileId, {parent : {id : pathId}}, function(err, updatedFile) {
      if(err) {
        if(err.statusCode==409) callback(409, null);
        else {
          client.folders.update(fileId, {parent : {id : pathId}}, function(err, updatedFolder) {
            if(err) {
              if(err.statusCode==404) callback(404, null);
            } else {
              var uploadfile = {
                'id' : updatedFolder.id,
                'name' : updatedFolder.name,
                'type' : updatedFolder.type,
                'modifiedTime' : updatedFolder.modified_at,
                'size' : updatedFolder.size,
                'parents' : updatedFolder.parent.id
              }
              console.log('moving folder completed');
              callback(1, uploadfile);
            }
          });
        }
      } else {
        var uploadfile = {
          'id' : updatedFile.id,
          'name' : updatedFile.name,
          'type' : updatedFile.type,
          'modifiedTime' : updatedFile.modified_at,
          'size' : updatedFile.size,
          'parents' : updatedFile.parent.id
        }
        console.log('moving file completed');
        callback(1, uploadfile);
      }
  	});
  }

  var thumbnail = function(client, fileId){
    client.files.getThumbnail(fileId)
  	.then(thumbnailInfo => {
  		if (thumbnailInfo.location) {
  			// fetch thumbnail from URL
        console.log('fetch thumbnail from URL');
        console.log(thumbnailInfo);
  		} else if (thumbnailInfo.file) {
  			// use response.file Buffer contents as thumbnail
        console.log('use response.file Buffer contents as thumbnail');
        console.log(thumbnailInfo);
  		} else {
  			// no thumbnail available
        console.log('no thumbnail available');
  		}
  	});
  }


  return {
    listAllFiles: listAllFiles,
    findFolderPath: findFolderPath,
    searchForFolderId: searchForFolderId,
    searchForContent: searchForContent,
    searchForSelectType: searchForSelectType,
    refreshFilelist: refreshFilelist,
    refreshToken: refreshToken,
    uploadFile: uploadFile,
    uploadFileRest: uploadFileRest,
    downloadFile: downloadFile,
    deleteFile: deleteFile,
    deleteFileRest: deleteFileRest,
    createFolder: createFolder,
    renameFile: renameFile,
    movePath: movePath,
    thumbnail: thumbnail
  }

})();
