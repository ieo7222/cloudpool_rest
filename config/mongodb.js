var mongoose    = require('mongoose');

// ......

// [ CONFIGURE mongoose ]
module.exports = function(){
// CONNECT TO MONGODB SERVER
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server");
});

mongoose.connect('mongodb://localhost/cloudpool-api-server');
};
