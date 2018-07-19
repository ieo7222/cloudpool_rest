var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var google_file_list = new Schema({
  user_id : String,
  accesstoken : String,
  refreshtoken : String,
  check : Boolean,
  check_time : { type: String , default: Date.now  },
  folderID : String,
  file_list: Array
});




module.exports = mongoose.model('google_file_list', google_file_list);


//user_id, accesstoken, check, check_time, file_list
