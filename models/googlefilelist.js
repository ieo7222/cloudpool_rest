var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var google_file_list = new Schema({
  user_id : String,
  accesstoken : String,
  refreshtoken : String,
  check : Boolean,
  root_id : String,
  check_time : { type: String , default: Date.now  },
  file_list: Array,
  max_depth: Number
});

module.exports = mongoose.model('google_file_list', google_file_list);