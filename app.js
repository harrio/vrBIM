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

var PythonShell = require('python-shell');

var app = express();

var nameMap = {};
var PORT = 3000;


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
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'gltf')));

/*app.use('/', routes);
app.use('/users', users);*/

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

app.get('/', (req, res, next) => {
  fs.readdir("./gltf", (err, items) => {
      console.log(items);
      var models = items.filter((item) => { return item.indexOf(".js") > 0});
      res.render("models.jade", {"models": models});
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

var convertObjToJson = (srcPath, originalName) => {
  var options = {
    mode: 'text',
    args: ['-i', srcPath, '-o', "gltf/" + originalName + '.js']
  };

  PythonShell.run('convert_obj_three.py', options, function (err, results) {
    if (err) throw err;
    fs.unlink(srcPath, () => { console.log("OBJ file deleted.")})
    fs.unlink("gltf/" + originalName + '.mtl', () => { console.log("MTL file deleted.")})
    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
  });
}

var convertIfc = (path) => {
  var filename = path.replace(/^.*[\\\/]/, '');
  var originalName = nameMap[filename];
  console.log("CONVERT " + path + " -> " + originalName);
  var objPath = './gltf/' + originalName + '.obj';
  ifcConvert(path, objPath, {path: '.'})
   .then(() => {
     convertObjToJson(objPath, originalName);
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

var port = process.argv[2];
port = port ? port : PORT;

app.listen(port, () => {
  console.log('Example app listening on port '+port+'!');
});

module.exports = app;
