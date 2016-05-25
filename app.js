var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var watchr = require('watchr');
var ifcConvert = require('ifc-convert');
var collada2gltf = require('collada2gltf');
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

var nameMap = {};


app.use(bodyParser.json());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'gltf')));

app.use('/', routes);
app.use('/users', users);

app.post('/upload', multer({ dest: './ifc/'}).single('upl'), (req,res) => {
 	console.log(req.file); //form files
	/* example output:
            { fieldname: 'upl',
              originalname: 'grumpy.png',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: './uploads/',
              filename: '436ec561793aa4dc475a88e84776b1b9',
              path: 'uploads/436ec561793aa4dc475a88e84776b1b9',
              size: 277056 }
	 */
  nameMap[req.file.filename] = req.file.originalname;
  res.status(204).end();
});

app.get('/models', (req, res, next) => {
  fs.readdir("./gltf", (err, items) => {
      console.log(items);
      var gltfs = items.filter((item) => { return item.indexOf(".gltf") > 0});
      res.render("models.jade", {"models": gltfs});
      //res.send(gltfs.map((item) => { return {"file": item}}));
  });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var convertIfc = (path) => {
  var filename = path.replace(/^.*[\\\/]/, '');
  var originalName = nameMap[filename];
  console.log("CONVERT " + path + " -> " + originalName);
  var daePath = './gltf/' + originalName + '.dae';
  ifcConvert(path, daePath, {path: '.'})
   .then(() => {
     collada2gltf(daePath, {path: '.'}, (err) => {
       if (err) {
         console.log("ERR " + err);
       } else {
         fs.unlink(daePath, () => { console.log("Temp file deleted.")})
         console.log("DONE");
       }
     })
  })
  .catch((e) => { console.log("IFC conversion failed", e) });
}

watchr.watch({
  paths: ['./ifc'],
    listeners: {
      change: (changeType, filePath, fileCurrentStat, filePreviousStat) => {
        if (changeType == 'create') {
          console.log("CREATED " + filePath);
          convertIfc(filePath);
        }
      },
      log: (logLevel) => {
            //console.log('a log message occured:', arguments);
        },
        error: (err) => {
            console.log('an error occured:', err);
        },
        watching: (err,watcherInstance,isWatching) => {
            if (err) {
                console.log("watching the path " + watcherInstance.path + " failed with error", err);
            } else {
                //console.log("watching the path " + watcherInstance.path + " completed");
            }
        }
    },
    next: (err,watchers) => {
        if (err) {
            return console.log("watching everything failed with error", err);
        } else {
            console.log('watching everything completed');
        }
    }
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

module.exports = app;
