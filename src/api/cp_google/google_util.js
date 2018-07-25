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

        setlist(Accesstoken,oauth2Client,userId, function(FileList){
          var google_list = new google_file_list();
          google_list.user_id = userId;
          google_list.accesstoken = Accesstoken;
          google_list.check = true;
          google_list.file_list= FileList;
          google_list.root_id=rootId;
          google_list.max_depth=2;
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


  var addlist = function(oauth2Client,userId,Fdepth, callbackResult){
    console.log('add list 함수 실행 ');
    var drive = google.drive({version : 'v3', auth: oauth2Client });

    google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
      if(err){
        console.log("db Find method error : ",err);
      }
      var newFileList=[];
      var q_cnt=0;
      console.log('mongoDB로 부터 받은 파일수 : ',user[0].file_list.length);
      console.log('1번째 async 실행 ');
      console.log('탐색 depth ',Fdepth);

        async.map(user[0].file_list,function(file,callback1){
        if(file.depth==Fdepth&&file.mimeType=='application/vnd.google-apps.folder'){
          console.log(Fdepth,"에서 탐색 할 folder : ", file.name);
          var query = "parents in '"+file.id+"' and trashed =false";
          var filelist =[];
          drive.files.list({
            q: query,
            fields: "nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,size,parents)",
            pageSize: 1000,
            spaces: 'drive',
          }, function (err, res) {
            if (err) {
              console.log('api err depth: ',Fdepth);
              console.log(err);
              callback1(err)
            } 
            else {
              q_cnt=q_cnt+1;
              console.log("api 호출 횟수 : ",q_cnt);
              async.map(res.data.files, function(file, callback2){
                var fileinfo = {
                  'id' : file.id,
                  'name' : file.name,
                  'mimeType' : file.mimeType,
                  'modifiedTime' : file.modifiedTime,
                  'size' : file.size,
                  'parents' : file.parents,
                  'depth' : Fdepth+1
                };
                filelist.push(fileinfo);
                callback2(null,'finished');
              }, function(err, result){
                if(err) console.log('map err depth: ',Fdepth+1);
                else {
                  newFileList=newFileList.concat(filelist);
                  console.log('Finish the File list depth :'+Fdepth+1);
                  callback1(null,'finished');

                }
              });
            }
          });

        }
        else{
          callback1(null,'finished');
        }
      },function(err,result){
        console.log(Fdepth+1," depth 에서 탐색된 파일 개수 :", newFileList.length);
        callbackResult(newFileList);
      });
    });
}

var addFileList = function(oauth2Client,userId,folderId, CallBack){
  if(folderId=='root'){
    console.log('folder id is root');
    var Fdepth=0;
    addlist(oauth2Client,userId,Fdepth+2, function(newFilelist){
        google_file_list.update({"user_id":userId},{$push:{file_list:newFilelist}},function(err,result){
          CallBack(newFilelist.length);
      });

    })
  }
  else{
    google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, user){
      if(err){
        console.log("db Find method error : ",err);
      }
      var Fdepth;
      async.map(user[0].file_list,function(eachFile,callback4){
        if(eachFile.id==folderId){
          Fdepth=eachFile.depth;
          callback4();
        }
        else{
          callback4();
        }
      },function(err,result){
          console.log('탐색 depth : ',Fdepth+2,' 삽입 depth :',Fdepth+3);

          addlist(oauth2Client,userId,Fdepth+2, function(newFilelist){
            google_file_list.update({"user_id":userId},{$push:{file_list:newFilelist}},function(err,result){
              CallBack(newFilelist.length);
          });

        })
        
      });
    });
  }
}

  var searchFilelist = function (userId,folderId,keyWord,orderKey,keyType, CallBack){
    console.log('searchFilelist'); 
    var searchfilelist = function (userId,folderId,keyWord,orderKey,keyType, callback){
      google_file_list.find({"user_id":userId},{file_list:1,_id:0,} ,function(err, userlist){
        if(err){
          console.log("db Find method error : ",err);
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
                  callback_list(null);
                },
              function(err,result){
                  if(err) {
                    console.log("Fail the Folder list error code : ",err);
                    callback(null);
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
                          filteredList.sort(function(a,b) {
                            return parseFloat(a.mimeType) - parseFloat(b.mimeType);
                          });
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
    // filteredList.unshift('0AGCP8EhCswtnUk9PVA');
    if(folderId=='root'){
      console.log('folder id is root');
      google_file_list.find({"user_id":userId},{root_id:1,_id:0,} ,function(err, rootId){
        if(err){
          console.log("db Find method error : ",err);
        }
          console.log('탐색 id : rootId[0].root_id',);
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
          searchfilelist(userId,folderId,keyWord,orderKey,keyType, function(FileList){
            FileList.unshift(upperDirId);
            CallBack(FileList);
          })
        });
      });
    }

}



  return {
    setFilelist: setFilelist,
    searchFilelist: searchFilelist,
    addFilelist:addFileList
    // uploadFile: uploadFile,
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
