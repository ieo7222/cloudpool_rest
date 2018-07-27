// // *
// // * @file google_util
// // * @author sexylee
// // *
// // * @description This module is composed of convenient functions of google drive
// // *
// // */

var async = require('async')
, {google} = require('googleapis')
, google_file_list = require('../../../models/googlefilelist');


var mimelist = {
  "document": ['application/vnd.google-apps.document','application/x-abiword',	'text/css',	'text/csv',	'application/msword',	'application/vnd.oasis.opendocument.presentation',	'application/vnd.oasis.opendocument.spreadsheet',	'application/vnd.oasis.opendocument.text',	'application/vnd.ms-powerpoint',	'application/vnd.ms-excel'],
  "PDF": ['application/pdf'],
  "video": ['video/x-msvideo',	'video/ogg',	'video/webm', 'video/mp4', 'video/mpeg', 'video/avi', 'video/wmv', 'video/mkv', 'video/mpg'],
  "image": ['image/gif',	'image/x-icon',	'image/jpeg',	'image/svg+xml',	'image/tiff',	'image/webp', 'image/jpg'],
  "audio": ['audio/aac',	'audio/midi',	'audio/ogg',	'audio/x-wav',	'audio/webm', 'audio/mp3', 'audio/wma']
  // "etc":
};

module.exports = (function() {
  var setFilelist = function(Accesstoken,oauth2Client,userId, callbackResult){

    var drive = google.drive({version : 'v3', auth: oauth2Client });

    var setlist = function(Accesstoken,oauth2Client,userId, CallBack){
      var drive = google.drive({version : 'v3', auth: oauth2Client });
      var pageToken = null;
    // Using the NPM module 'async'
      var FileList=[];
      async.doWhilst(function (callback) {
        drive.files.list({
          q: "trashed=false",
          fields: "nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,size,parents)",
          spaces: 'drive',
          pageSize: 460,
          pageToken: pageToken
        }, function (err, res) {
          if (err) {
            // Handle error
            console.error(err);
            callback(err)
          } 
          else {
            FileList=FileList.concat(res.data.files);
            console.log(res.data.files.length);
            pageToken = res.data.nextPageToken;
            callback();
          }
        });
      }, function () {
        return !!pageToken;
      }, function (err) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
        console.log('list 받기 종료 ');
        console.log(FileList.length,' file(s) added!');
        CallBack(FileList);
        }
      }); 
    }

    var Query = "parents in 'root' and trashed =false";
    var rootId;
    drive.files.list({
      q: Query,
      fields: "nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,size,parents)",
      pageSize: 2,
      spaces: 'drive'
    }, function (err, res) {
      if (err) {
        console.log('api error :',err);
      } 
      else {
        rootId=res.data.files[0].parents[0];

        google_file_list.remove({"user_id":userId} ,function(err, result){
          if(err){
            console.log('mongodb err');
          }
          else{
            setlist(Accesstoken,oauth2Client,userId, function(FileList){
              var google_list = new google_file_list();
              google_list.user_id = userId;
              google_list.accesstoken = Accesstoken;
              google_list.check = true;
              google_list.file_list= FileList;
              google_list.root_id=rootId;
              google_list.save(function(err){
                  if(err){
                    console.error('save err: ',err);
                    return;
                  }
              });
              callbackResult(FileList.length);
            });
          }
        });
      }
    });

  }

  var deleteUserData=function(userId,callback){

  }



//   var addlist = function(oauth2Client,userId,Fdepth, callbackResult){
//     console.log('add list 함수 실행 ');
//     var drive = google.drive({version : 'v3', auth: oauth2Client });

//     google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
//       if(err){
//         console.log("db Find method error : ",err);
//       }
//       var newFileList=[];
//       var q_cnt=0;
//       console.log('mongoDB로 부터 받은 파일수 : ',user[0].file_list.length);
//       console.log('1번째 async 실행 ');
//       console.log('탐색 depth ',Fdepth);

//         async.map(user[0].file_list,function(file,callback1){
//         if(file.depth==Fdepth&&file.mimeType=='application/vnd.google-apps.folder'){
//           console.log(Fdepth,"에서 탐색 할 folder : ", file.name);
//           var query = "parents in '"+file.id+"' and trashed =false";
//           var filelist =[];
//           drive.files.list({
//             q: query,
//             fields: "nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,size,parents)",
//             pageSize: 1000,
//             spaces: 'drive',
//           }, function (err, res) {
//             if (err) {
//               console.log('api err depth: ',Fdepth);
//               console.log(err);
//               callback1(err)
//             } 
//             else {
//               q_cnt=q_cnt+1;
//               console.log("api 호출 횟수 : ",q_cnt);
//               async.map(res.data.files, function(file, callback2){
//                 var fileinfo = {
//                   'id' : file.id,
//                   'name' : file.name,
//                   'mimeType' : file.mimeType,
//                   'modifiedTime' : file.modifiedTime,
//                   'size' : file.size,
//                   'parents' : file.parents,
//                   'depth' : Fdepth+1
//                 };
//                 filelist.push(fileinfo);
//                 callback2(null,'finished');
//               }, function(err, result){
//                 if(err) console.log('map err depth: ',Fdepth+1);
//                 else {
//                   newFileList=newFileList.concat(filelist);
//                   console.log('Finish the File list depth :'+Fdepth+1);
//                   callback1(null,'finished');

//                 }
//               });
//             }
//           });

//         }
//         else{
//           callback1(null,'finished');
//         }
//       },function(err,result){
//         console.log(Fdepth+1," depth 에서 탐색된 파일 개수 :", newFileList.length);
//         callbackResult(newFileList);
//       });
//     });
// }

// var addFileList = function(oauth2Client,userId,folderId, CallBack){
//   if(folderId=='root'){
//     console.log('folder id is root');
//     var Fdepth=0;
//     addlist(oauth2Client,userId,Fdepth+2, function(newFilelist){
//         google_file_list.update({"user_id":userId},{$push:{file_list:newFilelist}},function(err,result){
//           CallBack(newFilelist.length);
//       });

//     })
//   }
//   else{
//     google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
//       if(err){
//         console.log("db Find method error : ",err);
//       }
//       var Fdepth;
//       async.map(user[0].file_list,function(eachFile,callback4){
//         if(eachFile.id==folderId){
//           Fdepth=eachFile.depth;
//           callback4();
//         }
//         else{
//           callback4();
//         }
//       },function(err,result){
//           console.log('탐색 depth : ',Fdepth+2,' 삽입 depth :',Fdepth+3);

//           addlist(oauth2Client,userId,Fdepth+2, function(newFilelist){
//             google_file_list.update({"user_id":userId},{$push:{file_list:newFilelist}},function(err,result){
//               CallBack(newFilelist.length);
//           });

//         })
        
//       });
//     });
//   }
// }

  var searchFilelist = function (userId,folderId,keyWord,orderKey,keyType, CallBack){
    console.log('searchFilelist'); 
    var searchfilelist = function (userId,folderId,keyWord,orderKey,keyType, callback){
      google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, userlist){
        if(err||userlist[0].file_list==undefined){
          console.log("db Find method error : ",err);
          callback();
        }
        else{
          var filteredList =[];
          if(keyType=="document") var mimetype = mimelist.document;
          else if(keyType=="PDF") var mimetype = mimelist.PDF;
          else if(keyType=="video") var mimetype = mimelist.video;
          else if(keyType=="image") var mimetype = mimelist.image;
          else if(keyType=="audio") var mimetype = mimelist.audio;
          console.log("keyType : ",mimetype);

          async.map(userlist[0].file_list, 
              function(file,callback_list){
                  if(folderId!=undefined&&file.parents==folderId){
                    console.log(file.parents==folderId);
                    //folder 클릭에 의한 list
                    filteredList.push(file);
                  }
                  else if(folderId==undefined){
                    //검색 or 카테고리클릭에 의한 list
                    if(keyWord!=undefined&&keyType!='...'){
                      async.map(mimetype, 
                        function(type, callback_type){
                          if(file.mimeType==type&&file.name.indexOf(keyWord)!=-1){
                            filteredList.push(file);
                            callback_type(null,'finish');
                          }
                          else{
                            callback_type(null,'fail');
                          }
                        },
                        function(err, result){
                          if(err) {
                            console.log(err);
                          }
                        });
                      }
                    else if(keyType!='...'){
                      async.map(mimetype, 
                        function(type, callback_type){
                          if(file.mimeType==type){
                            console.log(file.mimeType==type);
                            filteredList.push(file);
                            callback_type(null,'finish');
                          }
                          else{
                            callback_type(null,'fail');
                          }
                        },
                        function(err, result){
                          if(err) {
                            console.log(err);
                          }
                        });
                      }
                    else if(keyWord!=undefined&&file.name.indexOf(keyWord)!=-1){
                      filteredList.push(file);
                    }
                  }
                  callback_list();
                },
              function(err,result){
                  if(err) {
                    console.log("Fail the Folder list error code : ",err);
                    callback();
                  }
                  else {                  
                    console.log('Finished Filtering');
                      if(orderKey!=undefined){
                        if(orderKey=='name'){
                          filteredList.sort(function(a,b) {
                            return parseFloat(a.name) - parseFloat(b.name);
                          });
                          console.log('name arrange');
                        }
                        else if(orderKey=='type'){
                          console.log('type정렬!');
                          filteredList.sort(function(a,b) {
                            return parseFloat(b.mimeType.indexOf('folder')) -parseFloat(a.mimeType.indexOf('folder'));                          });
                          console.log('type arrange');
                        }
                      }
                      console.log('finished1');
                      callback(filteredList);
                      // console.log(filteredList);
                      console.log('finished2');

                  }
              });
              
        }
      });
    }
    if(folderId==undefined){
      google_file_list.find({"user_id":userId},{root_id:1,_id:0,} ,function(err, user){
        searchfilelist(userId,folderId,keyWord,orderKey,keyType, function(FileList){
          FileList.unshift(user[0].root_id);
          CallBack(FileList);
        });
      });
    }
    else if(folderId=='root'){
      console.log('folder id is root');
      google_file_list.find({"user_id":userId},{root_id:1,_id:0,} ,function(err, rootId){
        if(err){
          console.log("db Find method error : ",err);
        }
          console.log('탐색 id :', rootId[0].root_id);
        searchfilelist(userId,rootId[0].root_id,keyWord,orderKey,keyType, function(FileList){
          FileList.unshift(rootId[0].root_id);
          CallBack(FileList);
        })
      });
    }
    else{
      google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
        if(err){
          console.log("db Find method error : ",err);
        }
        var upperDirId;
        // console.log(user);
        async.map(user[0].file_list,function(eachFile,callback4){
          if(eachFile.id==folderId){
            upperDirId=eachFile.parents[0];
            callback4();
          }
          else{
            callback4();
          }
        },function(err,result){
          if(err){
            CallBack();
          }
          else{
            searchfilelist(userId,folderId,keyWord,orderKey,keyType, function(FileList){
              FileList.unshift(upperDirId);
              CallBack(FileList);
            })
          }
        });
      });
    }

}

  var refreshToken = function(user_id, accesstoken, callback){
    google_file_list.update({
      user_id: user_id
    }, {
      $set: {
        accesstoken: accesstoken
      }
    }, function(err, output) {
      if (err) callback("error : " + err);
      else callback("success");
    });
  }

  var reName =function(userId,oauth2Client,fileId,newName,callback){
    var drive = google.drive({ version: 'v3', auth: oauth2Client});
    drive.files.update({
      fileId: fileId,
      resource: {
        "name": newName
      }
    }, (err, file) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      } else {
        console.log('file.data',file.data);
        var newFile = file.data;
        var idx;
        google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
          var fileList=user[0].file_list;
          async.map(user[0].file_list,function(file,callback1){
            if(file.id== fileId) {
                idx = user[0].file_list.indexOf(file);
                callback1(null,'finished');
              }
            else{
              callback1(null,'finished');
            }
          },function(err,result){
            if(idx!=undefined){
              var tempFile=fileList[idx];
              tempFile.name=newFile.name;
              fileList.splice(idx,1);
              fileList.push(tempFile);
    
              google_file_list.update({
                user_id: userId
              }, {
                $set: {
                  file_list: fileList
                }
              }, function(err, output) {
                if (err) callback("error : " + err);
                else callback("success");
              })
            }
            else{
              callback("there is no file");
            }
        });
      });
      
    }
  });
}

  var deleteFile = function(userId,oauth2Client,fileId,callback){
      var drive = google.drive({ version: 'v3',  auth: oauth2Client });
      drive.files.delete({'fileId': fileId},function(err,file){
        if(err) console.log(err);
        var idx;
        google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
          var fileList=user[0].file_list;
          async.map(user[0].file_list,function(file,callback1){
            if(file.id== fileId) {
                idx = user[0].file_list.indexOf(file);
                callback1(null,'finished');
              }
            else{
              callback1(null,'finished');
            }
          },function(err,result){
            if(idx!=undefined){
              fileList.splice(idx,1);

              google_file_list.update({
                user_id: userId
              }, {
                $set: {
                  file_list: fileList
                }
              }, function(err, output) {
                if (err) callback("error : " + err);
                else callback("success");
              })
            }
            else{
              callback("there is no file to delete");
            }
        });
      });
    });
  }

  var downloadFile = function(userId,fileId,callback){
    google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
      var fileList=user[0].file_list;
      var name;
      var mimeType;

      async.map(user[0].file_list,function(file,callback1){
        if(file.id== fileId) {
            name = file.name;
            mimeType = file.mimeType;
            callback1(null,'finished');
          }
        else{
          callback1(null,'finished');
        }
      },function(err,result){
        if (err) callback("error : " + err);
        else{
          var data = {
            "name" : name ,
            "mimeType": mimeType
          }
          callback(data);
        }
    });
  });
}

  var uploadFile = function(userId,newFile,callback){
      google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
        var fileList=user[0].file_list;
        fileList.push(newFile);
        console.log("newFile");
        google_file_list.update({
            user_id: userId
          }, {
            $set: {
              file_list: fileList
            }
          }, function(err, output) {
            if (err) callback("error : " + err);
            else callback("success");
          });
        })
    }

    var moveDir = function(userId,oauth2Client,fileId,folderId,CurfolderId,callback){
      var drive = google.drive({
        version: 'v3',
        auth: oauth2Client
      });

      var Parents=[];
      Parents.push(CurfolderId);
      var previousParents = Parents.join(',');
      console.log('previous Parents : ', previousParents);
      drive.files.update({
        fileId: fileId,
        addParents: folderId,
        removeParents: previousParents,
        fields: 'id, name'
      }, function(err, res) {
        if (err) {
          // Handle error
        } else {
          console.log('################이동한 파일 :', res.data,'################');
          var newFile = res.data;
          var idx;
          google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
            var fileList=user[0].file_list;
            async.map(user[0].file_list,function(file,callback1){
              if(file.id== fileId) {
                  idx = user[0].file_list.indexOf(file);
                  console.log('idx: ',idx);
                  callback1(null,'finished');
                }
              else{
                callback1(null,'finished');
              }
            },function(err,result){
              if(idx!=undefined){
                var tempFile=fileList[idx];
                console.log('temp file: ',tempFile);
                tempFile.parents=folderId;
                console.log('바뀐후: ',tempFile);
                fileList.splice(idx,1);
                fileList.push(tempFile);
      
                google_file_list.update({
                  user_id: userId
                }, {
                  $set: {
                    file_list: fileList
                  }
                }, function(err, output) {
                  if (err) callback("error : " + err);
                  else callback("success");
                })
              }
              else{
                callback("there is no file");
              }
          });
        });

          // File moved.
        }
      });
    }
    
    var deleteUserData=function(userId,callback){
      google_file_list.remove({"user_id":userId} ,function(err, result){
        if(err){
          callback(err);
        }
        else{
          callback('successfully removed');
        }
      });
    }


      //   async.map(user[0].file_list,function(file,callback1){
      //     if(file.id== fileId) {
      //         idx = user[0].file_list.indexOf(file);
      //         callback1(null,'finished');
      //       }
      //     else{
      //       callback1(null,'finished');
      //     }
      //   },function(err,result){
      //     if(idx!=undefined){
      //       fileList.splice(idx,1);

      //       google_file_list.update({
      //         user_id: userId
      //       }, {
      //         $set: {
      //           file_list: fileList
      //         }
      //       }, function(err, output) {
      //         if (err) callback("error : " + err);
      //         else callback("success");
      //       })
      //     }
      //     else{
      //       callback("there is no file to delete");
      //     }
      // });
    
  //   var updateFile = function(Newname, fileId,oauth2Client) {
  //   var drive = google.drive({
  //     version: 'v3',
  //     auth: oauth2Client
  //   });

  //   drive.files.update({
  //     fileId: fileId,
  //     resource: {
  //       "name": Newname
  //     }
  //   }, (err, file) => {
  //     if (err) {
  //       console.log('The API returned an error: ' + err);
  //       return;
  //     } else {
  //       console.log(file.data);
  //     }
  //   });

  //   console.log("name completely changed!");
  //   // res.redirect('google/rootroot);
  // }


  return {
    setFilelist: setFilelist,
    searchFilelist: searchFilelist,
    // addFilelist:addFileList,
    refreshToken:refreshToken,
    reName:reName,
    deleteFile:deleteFile,
    uploadFile: uploadFile,
    moveDir:moveDir,
    downloadFile:downloadFile,
    deleteUserData:deleteUserData
    // deleteFile: deleteFile,
    // updateFile: updateFile,
    // updateDir: updateDir,
    // searchName: searchName,
    // searchType: searchType,
    // makeDir: makeDir,
    // copyFile: copyFile,
    // getThumbnailLink: getThumbnailLink
  }
})();
