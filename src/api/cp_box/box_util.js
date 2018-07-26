module.exports = (function(){
  var async = require('async');
  var fs = require('fs');
  var box_file_list = require('../../../models/boxfilelist');

  var listAllFiles = function(client, folderId, callback) {
    client.folders.getItems(
      folderId,
      {
        fields: 'name,size,modified_at'
      })
      .then(function(items){
        var filelist = [];
        async.map(items.entries, function(item, callback_list){
          var iteminfo = {
            'id' : item.id,
            'name' : item.name,
            'mimeType' : item.type,
            'modifiedTime' : item.modified_at,
            'size' : item.size,
            'parents' : folderId
          }
          filelist.push(iteminfo);
          if(item.type=='folder'){
            listAllFiles(client,item.id,function(filelist_child){
              filelist = filelist.concat(filelist_child);
              callback_list(null, "finish");
            });
          } else callback_list(null, "finish");
        }, function(err, result){
          if(err) console.log(err);
          else {
            callback(filelist);
          }
        });
      });
    }

  var searchFilelist = function (userId, folderId, callback){
    var Option={
      "user_id":userId
    }
    box_file_list.find(Option,{file_list:1,_id:0} ,function(err, userlist){
      if(err){
        console.log("db Find method error : ",err);
      }
      else{
        var filteredList =[];
        async.map(userlist[0].file_list,
          function(file,callback_list){
            if(file.id==folderId){
              var beforeFolder = {
                'id' : file.parents,
                'name' : '..',
                'mimeType' : 'folder'
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
    client.files.uploadFile(FolderID, FileInfo.name, stream, function(err ,newfile){
      if(err) console.log(err);
      else{
        //파일 아이디
        console.log(newfile.entries[0].id);
        var uploadfile = {
          'id' : newfile.entries[0].id,
          'name' : newfile.entries[0].name,
          'mimeType' : newfile.entries[0].type,
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
    client.files.delete(fileId).then(() => {
      console.log('deletion succeeded');
      callback(1);
    });
  }

  var deleteFileRest = function(user_id, fileId, result, callback){
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
      var folder = {
        'id' : newfolder.id,
        'name' : newfolder.name,
        'mimeType' : newfolder.type,
        'modifiedTime' : newfolder.modified_at,
        'size' : newfolder.size,
        'parents' : folderID
      }
      callback(folder);
    });
  }

  var renameFile = function(client, fileId, newname){
    client.files.update(fileId, {name : newname})
  	.then(updatedFile => {
  		console.log('renaming file completed');
  	});
  }

  var renameFolder = function(client, folderId, newname){
    client.folders.update(folderId, {name : newname})
  	.then(updatedFolder  => {
  		console.log('renaming folder completed');
  	});
  }

  var moveFile = function(client, fileId, parentId){
    client.files.update(fileId, {parent : {id : parentId}})
  	.then(updatedFile => {
  		console.log('moving file completed');
  	});
  }

  var moveFolder = function(client, folderId, parentId){
    client.folders.update(folderId, {parent : {id : parentId}})
  	.then(updatedFolder => {
  		console.log('moving folder completed');
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

  var search = function(client, searchText, callback){
    client.search.query(
  	searchText,
  	{
  		//restriction
  	})
  	.then(results => {
      var filelist = [];
      async.map(results.entries, function(item, callback_list){
        var iteminfo={
          'id' : item.id,
          'name' : item.name,
          'mimeType' : item.type,
          'modifiedTime' : item.modified_at,
          'size' : item.size
        };
        filelist.push(iteminfo);
        callback_list(null, 'finish');
      },
      function(err,result){
        if(err) console.log(err);
        //list 받아오기 완료
        else {
          console.log('Finish the File list');
          callback(filelist);
        }

      });
  	});
  }


  return {
    listAllFiles: listAllFiles,
    searchFilelist: searchFilelist,
    refreshFilelist: refreshFilelist,
    refreshToken: refreshToken,
    uploadFile: uploadFile,
    uploadFileRest: uploadFileRest,
    downloadFile: downloadFile,
    deleteFile: deleteFile,
    deleteFileRest: deleteFileRest,
    createFolder: createFolder,
    renameFile: renameFile,
    renameFolder: renameFolder,
    moveFile: moveFile,
    moveFolder: moveFolder,
    thumbnail: thumbnail,
    search: search
  }

})();
