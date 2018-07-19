var initDropbox = require('./dropbox_init')
, path = require('path')
, fetch = require('isomorphic-fetch')
, fs = require('fs')
, https = require('https')
, async = require('async')
, mime = require('mime');
//스키마 생성
var dbx_file_list = require('../../../models/dbxfilelist');
var dbxutil=require('./dropbox_util.js');
module.exports = function(){

  //현재 접속중인 유저들 check로 확인

    setInterval( function() {
      console.log("Start auto refresh dropbox list");
        dbx_file_list.find({check : true},
          function (err, at_lists){
              if(err) return console.log("error : "+err);
              if(at_lists.length === 0) return console.log("error: lists not found");
               async.map(at_lists,
                   function(list, callback){
                     var Accesstoken = list.accesstoken;
                     if(list.folder==undefined){
                       var FolderID='';
                     }
                     else var FolderID = list.folderId ;
                     var nowTime =  new Date().getTime();

                     if(nowTime-list.check_time >30000){
                     //최근 refresh시간이 30초 미만일때 접속중인 사용자들 일괄적으로 30초마다 refresh
                       dbxutil.list(Accesstoken, FolderID, function(filelist){
                         dbx_file_list.update({ _id: list._id }, { $set: {check_time : nowTime , file_list : filelist} }, function(err, output){
                             if(err) console.log("error : "+err);
                             console.log(output);
                             if(!output.n) return console.log('error: dbx_list not found');
                             callback(null,"finish -" + list._id);
                         })
                       });
                     }

                     else{
                       callback(null,"finish -" + list._id);
                     }
                          },
                    function(err,result_refresh){
                        console.log("Finish the refresh all dropbox list");
                          }
              );
            }
          );
      }
      , 30000);
};
