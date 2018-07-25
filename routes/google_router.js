var bodyParser = require('body-parser');
var google_util = require('../src/api/cp_google/google_util.js');
var initGoogle = require('../src/api/cp_google/google_init');

module.exports = function(app)
{
  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.post('/api/google/set/', function(req, res){
    console.time('alpha');
    var Accesstoken = req.body.CP_love;
    var userId =req.body.userId;
    initGoogle(Accesstoken,function(oauth2Client){
      google_util.setFilelist(Accesstoken, oauth2Client,userId, function(result){
        console.timeEnd('alpha');
        res.json({result: result});
        });
    });
  });
  
  app.post('/api/google/check/', function(req, res){
    var keyWord =req.body.keyWord;
    var orderKey='type';
    var keyType= req.body.keyType;
    var folderId=req.body.folderId;
    var userId=req.body.userId;
    console.log(req.body);
    google_util.searchFilelist(userId,folderId,keyWord,orderKey,keyType,function(fileList){
      res.json(JSON.stringify(fileList));
    });
  });

  

// var Accesstoken=' ya29.Glz-Bb1LH__GuQFbCsx4LQUt_lISjDSfTUQPxvAuv4IN19O0Zpma8m1-tBVgCAJeox4b8I9L1Fsa79-kSXQyhbACrKMnhfORBO-nXCLrvcGY9SgF8mAwjq0ZYaPCqg';
// initGoogle(Accesstoken,function(oauth2Client){
//   google_util.addFilelist(oauth2Client,userId,folderId,function(result){
//     console.log(result,' file(s) added');
//   });
// });      


  // app.get('/api/google/add/', function(req, res){
  //   // var keyWord =req.body.keyWord;
  //   // var orderKey;//='name';
  //   // var keyType= req.body.keyType;
  //   var Accesstoken='ya29.Glz9BXQ-N1ZBtI3L-xj_lhbG2WDcOIlZVAqYbcI7O2Q_jS-poK6z1NdBJLl6zWX7vSDQY-3jB25QeUi0spx4m2jWpttVv0TryuVR-Iyd7F9UOEQkfOuq3KmTDH5H7g';
  //   var userId="lee";
  //   var folderDepth=0;
  //   //이부분은 accesstoken을 불러오는걸로 

  //   initGoogle(Accesstoken,function(oauth2Client){
  //     google_util.addFilelist(oauth2Client,userId,folderDepth+2,function(result){
  //       console.log(result,' file(s) added');
  //     });
  //   });

  // });

}
