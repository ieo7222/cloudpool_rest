var box_init = require('./box_init')
, path = require('path')
, fetch = require('isomorphic-fetch')
, fs = require('fs')
, https = require('https')
, async = require('async')
, mime = require('mime');
//스키마 생성
var box_file_list = require('../../../models/boxfilelist');
var box_util=require('./box_util.js');
module.exports = function(){

  //현재 접속중인 유저들 check로 확인

    setInterval( function() {
      console.log("Start auto refresh box list");
        box_file_list.find({check : true},
          function (err, at_lists){
              if(err) return console.log("error : "+err);
              if(at_lists.length === 0) return console.log("error: lists not found");
               async.map(at_lists,
                   function(list, callback){
                     var nowTime = new Date().getTime();
                     if(nowTime-list.check_time >30000){
                       //최근 refresh시간이 30초 미만일때 접속중인 사용자들 일괄적으로 30초마다 refresh
                       var Accesstoken = list.accesstoken;
                       var folderId = '0';
                       var userId = list.user_id;
                       box_init(Accesstoken, function(client){
                         box_util.listAllFiles(client, folderId, function(filelist){
                           box_util.refreshFilelist(userId, filelist, function(result){
                             callback(null,"finish -" + list._id);
                           });
                         });
                       });
                     }

                     else{
                       callback(null,"finish -" + list._id);
                     }
                          },
                    function(err,result_refresh){
                        console.log("Finish the refresh all box list");
                          }
              );
            }
          );
      }
      , 30000);
};
