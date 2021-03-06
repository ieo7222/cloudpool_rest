// app.js
// [LOAD PACKAGES]
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var mongodb     = require('./config/mongodb.js');
var autocheck   = require('./src/api/cp_dropbox/dropbox_auto.js');
var autocheck_box   = require('./src/api/cp_box/box_auto.js');
// CONNECT TO MONGODB SERVER
// var db = mongoose.connection;
// db.on('error', console.error);
// db.once('open', function(){
//     // CONNECTED TO MONGODB SERVER
//     console.log("Connected to mongod server");
// });
//
// mongoose.connect('mongodb://localhost/cloudpool_api_server');



mongodb();
autocheck();
autocheck_box();

// [CONFIGURE APP TO USE bodyParser]
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// [CONFIGURE SERVER PORT]
var port = process.env.PORT || 4000;

//스키마 생성
// var Book = require('./models/book')



// // [CONFIGURE ROUTER] - 스키마 전달
// var router = require('./routes')(app,Book);


// [CONFIGURE ROUTER] - 스키마 전달
var dropbox_router = require('./routes/dropbox_router')(app);
var box_router = require('./routes/box_router')(app);
var google_router = require('./routes/google_router')(app);

// [RUN SERVER]
var server = app.listen(port, function(){
 console.log("Express server has started on port " + port)
});
