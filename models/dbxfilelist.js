var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var dbx_file_list = new Schema({
  user_id : String,
  accesstoken : String,
  check : Boolean,
  check_time : { type: String , default: Date.now  },
  file_list: Array
});




module.exports = mongoose.model('dbx_file_list', dbx_file_list);


//user_id, accesstoken, check, check_time, file_list
